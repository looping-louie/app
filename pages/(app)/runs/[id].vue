<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import HumanDecisionPanel from '~/components/runs/HumanDecisionPanel.vue'
import RunTimeline from '~/components/runs/RunTimeline.vue'
import WorkerReadinessPanel from '~/components/runs/WorkerReadinessPanel.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import type { ActivityResponse, ActivityRunHumanDecision, PipelineRunReadinessResponse, PipelineRunResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { runPrompt, type PipelineRunSnapshot } from '~/utils/pipelineRuns'

interface RunDetailData {
  snapshot: PipelineRunSnapshot
  pipelineName: string
  activitiesById: Map<string, ActivityResponse>
}

const route = useRoute()
const router = useRouter()
const api = useApiClient()
const { load: loadSnapshot, merge: mergeSnapshots } = usePipelineRunSnapshots()
const { refresh: refreshHumanGateNotifications } = useHumanGateNotifications()
const { projects } = useProjectContext()
const runId = computed(() => String(route.params.id))
const projectId = computed(() => typeof route.query.project === 'string' ? route.query.project : '')
const pipelineId = computed(() => typeof route.query.pipeline === 'string' ? route.query.pipeline : '')
const projectName = computed(() => projects.value.find(project => project.id === projectId.value)?.name ?? 'Current project')
const startingRun = ref(false)
const continuingRun = ref(false)
const runActionError = ref('')
const runReadiness = ref<PipelineRunReadinessResponse | null>(null)
const runReadinessLoading = ref(false)
const runReadinessError = ref('')
let readinessRequest = 0

interface HumanDecisionAttempt {
  activityRunId: string
  idempotencyKey: string
  decision: ActivityRunHumanDecision
  comment: string | null
}

const humanDecisionAttempt = ref<HumanDecisionAttempt | null>(null)

const { data, status, refresh } = await useAsyncData(
  () => `pipeline-run-detail-${projectId.value}-${pipelineId.value}-${runId.value}`,
  loadRunDetails,
)
const snapshot = computed(() => data.value?.snapshot ?? null)
const currentActivity = computed<ActivityResponse | null>(() => {
  const activityId = snapshot.value?.run.current_activity_run?.activity_id
  return activityId ? data.value?.activitiesById.get(activityId) ?? null : null
})
const runsRoute = computed(() => projectId.value ? `/runs?project=${encodeURIComponent(projectId.value)}` : '/runs')
const {
  applyRunUpdates,
  isRefreshing: isPollingRefreshing,
  isStale,
  staleMessage,
  refresh: retryPolling,
} = usePipelineRunPolling(
  () => snapshot.value ? [snapshot.value] : [],
  updateRunDetails,
  { refreshCatalog: refresh },
)

async function loadRunDetails(): Promise<RunDetailData> {
  if (!projectId.value || !pipelineId.value) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Run details require project and pipeline context.',
    })
  }
  const run = await api.pipelines.getRun(pipelineId.value, runId.value, projectId.value)
  const pipeline = await api.pipelines.get(run.pipeline_id)
  return {
    snapshot: await loadSnapshot(run, projectId.value),
    pipelineName: pipeline.name,
    activitiesById: new Map(pipeline.steps.map(step => [step.id, step] as const)),
  }
}

async function startPreparedRun() {
  const run = snapshot.value?.run
  if (!run || run.status !== 'prepared' || startingRun.value) return
  startingRun.value = true
  runActionError.value = ''
  try {
    await applyRunUpdates([await api.pipelines.startRun(run.pipeline_id, run.id, projectId.value)])
  } catch (cause) {
    runActionError.value = apiErrorMessage(cause, 'This prepared run could not be started. Please try again.')
  } finally {
    startingRun.value = false
  }
}

function newIdempotencyKey(): string {
  if (import.meta.client && typeof crypto.randomUUID === 'function') return `human-decision-${crypto.randomUUID()}`
  return `human-decision-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function submitHumanDecision(decision: ActivityRunHumanDecision, comment: string | null) {
  const run = snapshot.value?.run
  const activityRun = run?.current_activity_run
  if (!run || !activityRun || continuingRun.value) return

  const priorAttempt = humanDecisionAttempt.value
  const attempt = priorAttempt?.activityRunId === activityRun.id && priorAttempt.decision === decision && priorAttempt.comment === comment
    ? priorAttempt
    : { activityRunId: activityRun.id, idempotencyKey: newIdempotencyKey(), decision, comment }
  humanDecisionAttempt.value = attempt
  continuingRun.value = true
  runActionError.value = ''

  let decisionRecorded = activityRun.next_action !== 'submit_human_decision'
  try {
    if (!decisionRecorded) {
      if (!activityRun.continuation_token) throw new Error('The activity continuation token is missing.')
      const continuedActivity = await api.activities.continueRun(activityRun.activity_id, activityRun.id, projectId.value, {
        pipeline_run_id: run.id,
        lease_token: null,
        continuation_token: activityRun.continuation_token,
        idempotency_key: attempt.idempotencyKey,
        result: { action: 'submit_human_decision', decision, comment },
      })
      decisionRecorded = true
      replaceCurrentActivity(continuedActivity)
    }
    await continuePipeline()
    humanDecisionAttempt.value = null
  } catch (cause) {
    runActionError.value = decisionRecorded
      ? 'The decision was recorded, but the pipeline could not be resumed. Use “Continue pipeline” to retry.'
      : apiErrorMessage(cause, 'The human decision could not be recorded. Please try again.')
  } finally {
    continuingRun.value = false
  }
}

async function retryPipelineContinuation() {
  if (continuingRun.value) return
  continuingRun.value = true
  runActionError.value = ''
  try {
    await continuePipeline()
    humanDecisionAttempt.value = null
  } catch (cause) {
    runActionError.value = apiErrorMessage(cause, 'The decision is recorded, but the pipeline still could not be resumed.')
  } finally {
    continuingRun.value = false
  }
}

async function continuePipeline() {
  const run = snapshot.value?.run
  if (!run) return
  await applyRunUpdates([await api.pipelines.continueRun(run.pipeline_id, run.id, projectId.value, { lease_token: null })])
  await refreshHumanGateNotifications()
}

function replaceCurrentActivity(activityRun: NonNullable<PipelineRunResponse['current_activity_run']>) {
  if (!data.value) return
  data.value = {
    ...data.value,
    snapshot: { ...data.value.snapshot, run: { ...data.value.snapshot.run, current_activity_run: activityRun } },
  }
}

async function updateRunDetails(updates: PipelineRunResponse[]) {
  if (!data.value) return
  const snapshots = await mergeSnapshots([data.value.snapshot], updates)
  data.value = { ...data.value, snapshot: snapshots[0]! }
  if (snapshot.value?.run.status === 'queued') await refreshRunReadiness()
  else clearRunReadiness()
}

async function refreshRunReadiness() {
  const run = snapshot.value?.run
  const request = ++readinessRequest
  if (!run || run.status !== 'queued') {
    clearRunReadiness()
    return
  }
  runReadinessLoading.value = true
  runReadinessError.value = ''
  try {
    const readiness = await api.pipelines.getRunReadiness(run.pipeline_id, run.id, projectId.value)
    if (request !== readinessRequest) return
    runReadiness.value = readiness
  } catch (cause) {
    if (request !== readinessRequest) return
    runReadiness.value = null
    runReadinessError.value = apiErrorMessage(cause, 'Worker readiness could not be loaded. The run will remain queued and retry automatically.')
  } finally {
    if (request === readinessRequest) runReadinessLoading.value = false
  }
}

function clearRunReadiness() {
  readinessRequest += 1
  runReadiness.value = null
  runReadinessLoading.value = false
  runReadinessError.value = ''
}

function returnToRuns() {
  void router.push(runsRoute.value)
}

watch(
  () => [snapshot.value?.run.id, snapshot.value?.run.status],
  () => void refreshRunReadiness(),
)
onMounted(() => void refreshRunReadiness())
watch(
  () => [route.hash, snapshot.value?.run.id, snapshot.value?.run.status],
  async () => {
    if (!import.meta.client || route.hash !== '#human-gate' || snapshot.value?.run.status !== 'waiting') return
    await nextTick()
    document.getElementById('human-gate')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
  { immediate: true },
)

definePageMeta({ layout: 'app' })
useHead({ title: 'Run details · Looping Louie' })
</script>

<template>
  <PageShell title="Run details" :description="snapshot ? runPrompt(snapshot.run) : 'Inspect this pipeline execution.'">
    <template #actions>
      <UiButton variant="secondary" @click="returnToRuns">Back to runs</UiButton>
    </template>
    <UiAsyncStage :status="status" loading-label="Loading run details…" error-label="Run details could not be loaded." @retry="refresh">
      <div v-if="snapshot" class="run-details">
        <UiDataFreshnessNotice v-if="isStale" :description="staleMessage" :loading="isPollingRefreshing" @retry="retryPolling" />
        <div v-if="snapshot.run.status === 'prepared'" class="run-details__action">
          <p>This run is prepared and will not execute until it is started.</p>
          <UiButton :loading="startingRun" @click="startPreparedRun">Start run</UiButton>
        </div>
        <WorkerReadinessPanel
          v-else-if="snapshot.run.status === 'queued'"
          :readiness="runReadiness"
          :loading="runReadinessLoading"
          :error="runReadinessError"
          :project-name="projectName"
          @retry="refreshRunReadiness"
        />
        <div v-else-if="snapshot.run.status === 'claimed'" class="run-details__action run-details__action--informative" role="status">
          <div>
            <strong>Claimed by the runtime</strong>
            <p>The runtime has claimed this run and may still be preparing it before execution begins.</p>
          </div>
        </div>
        <HumanDecisionPanel
          v-if="snapshot.run.status === 'waiting'"
          :activity="currentActivity"
          :activity-run="snapshot.run.current_activity_run"
          :loading="continuingRun"
          @decide="submitHumanDecision"
          @continue="retryPipelineContinuation"
        />
        <p v-if="runActionError" class="run-details__error" role="alert">{{ runActionError }}</p>
        <RunTimeline
          :run="snapshot.run"
          :events="snapshot.events"
          :pipeline-name="data?.pipelineName"
          :activities-by-id="data?.activitiesById"
        />
      </div>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.run-details { display: grid; gap: var(--ll-space-6); }
.run-details__action { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding: var(--ll-space-4); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); }
.run-details__action--informative { justify-content: flex-start; }
.run-details__action--informative > div { display: grid; gap: var(--ll-space-2); }
.run-details__action p { margin: 0; color: var(--ll-color-text-muted); }
.run-details__error { margin: 0; color: var(--ll-color-brand-ink); }
@media (max-width: 38rem) { .run-details__action { align-items: flex-start; flex-direction: column; } }
</style>
