<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import HumanDecisionPanel from '~/components/runs/HumanDecisionPanel.vue'
import RunTimeline from '~/components/runs/RunTimeline.vue'
import WorkerReadinessPanel from '~/components/runs/WorkerReadinessPanel.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiDataFreshnessNotice from '~/components/ui/DataFreshnessNotice.vue'
import UiTable from '~/components/ui/Table.vue'
import type { ActivityResponse, ActivityRunHumanDecision, PipelineRunReadinessResponse, PipelineRunResponse, PipelineRunStatus } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { collectApiPages } from '~/utils/apiPagination'
import { needsTerminalEventRefresh, runPrompt, runTokenCount, type PipelineRunSnapshot } from '~/utils/pipelineRuns'

interface RunTableRow extends Record<string, unknown> {
  id: string
  pipelineId: string
  name: string
  pipeline: string
  status: string
  statusValue: PipelineRunResponse['status']
  created: string
  createdValue: string
  tokens: string
  runBy: string
}

const tableColumns = [
  { key: 'name', label: 'Initial prompt', width: '30%' },
  { key: 'pipeline', label: 'Pipeline', width: '18%' },
  { key: 'status', label: 'Status', type: 'option' as const },
  { key: 'created', label: 'Created' },
  { key: 'tokens', label: 'Tokens', align: 'end' as const },
  { key: 'runBy', label: 'Run by' },
]

const runStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'prepared', label: 'Prepared' },
  { value: 'queued', label: 'Queued' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const dateRangeOptions = [
  { value: 'last-24-hours', label: 'Last 24 hours' },
  { value: 'last-week', label: 'Last week' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-quarter', label: 'Last quarter' },
]

const route = useRoute()
const router = useRouter()
const api = useApiClient()
const { activeWorkspace } = useWorkspaceContext()
const runStatus = ref('all')
const dateRange = ref('last-24-hours')
const runSort = ref('newest')
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

const selectedDateRangeLabel = computed(() => (
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'Last 24 hours'
))

const { data, status, refresh } = await useAsyncData('pipeline-runs-catalog', loadRuns)
watch([runStatus, dateRange], () => void refresh())
const selectedSnapshot = computed(() => data.value?.snapshots.find(snapshot => snapshot.run.id === route.query.run) ?? null)
const {
  applyRunUpdates,
  isRefreshing: isPollingRefreshing,
  isStale,
  refresh: retryPolling,
} = usePipelineRunPolling(
  () => data.value?.snapshots ?? [],
  updateRunDetails,
)
const readinessWorkspaceName = computed(() => {
  const workspace = activeWorkspace.value
  if (workspace && workspace.id === runReadiness.value?.project_id) return workspace.name
  return 'Current workspace'
})
const selectedActivity = computed<ActivityResponse | null>(() => {
  const activityId = selectedSnapshot.value?.run.current_activity_run?.activity_id
  return activityId ? data.value?.activitiesById.get(activityId) ?? null : null
})
const displayedRuns = computed(() => {
  const cutoff = Date.now() - rangeDuration(dateRange.value)
  const rows = (data.value?.snapshots ?? [])
    .filter(({ run }) => (runStatus.value === 'all' || run.status === runStatus.value) && Date.parse(run.created_at) >= cutoff)
    .map(snapshot => toTableRow(snapshot, data.value?.pipelineNames.get(snapshot.run.pipeline_id) ?? snapshot.run.pipeline_id))
  return rows.sort((first, second) => {
    if (runSort.value === 'alphabetical-desc') return second.name.localeCompare(first.name)
    if (runSort.value === 'oldest') return Date.parse(first.createdValue) - Date.parse(second.createdValue)
    if (runSort.value === 'newest') return Date.parse(second.createdValue) - Date.parse(first.createdValue)
    return first.name.localeCompare(second.name)
  })
})

async function loadRuns() {
  const cutoff = new Date(Date.now() - rangeDuration(dateRange.value)).toISOString()
  const statusFilter = runStatus.value === 'all'
    ? undefined
    : runStatus.value as PipelineRunStatus
  const [pipelines, discoveredRuns] = await Promise.all([
    collectApiPages(offset => api.pipelines.list({ offset })),
    collectApiPages(offset => api.pipelineRuns.list({
      offset,
      status: statusFilter,
      created_from: cutoff,
    })),
  ])
  const selectedPipeline = typeof route.query.pipeline === 'string' ? route.query.pipeline : ''
  const selectedId = typeof route.query.run === 'string' ? route.query.run : ''
  if (selectedPipeline && selectedId && !discoveredRuns.some(run => run.id === selectedId)) {
    discoveredRuns.push(await api.pipelines.getRun(selectedPipeline, selectedId))
  }
  return {
    snapshots: await Promise.all(discoveredRuns.map(loadSnapshot)),
    pipelineNames: new Map(pipelines.map(pipeline => [pipeline.id, pipeline.name])),
    activitiesById: new Map(pipelines.flatMap(pipeline => pipeline.steps.map(step => [step.id, step] as const))),
  }
}

async function loadSnapshot(run: PipelineRunResponse): Promise<PipelineRunSnapshot> {
  const events = await collectApiPages(offset => api.pipelines.listRunEvents(run.pipeline_id, run.id, { offset }))
  return { run, events }
}

function selectRun(row: RunTableRow) {
  runActionError.value = ''
  void router.replace({ query: { ...route.query, pipeline: row.pipelineId, run: row.id } })
}

async function startPreparedRun() {
  const run = selectedSnapshot.value?.run
  if (!run || run.status !== 'prepared' || startingRun.value) return
  startingRun.value = true
  runActionError.value = ''
  try {
    const started = await api.pipelines.startRun(run.pipeline_id, run.id)
    await applyRunUpdates([started])
  } catch (cause) {
    runActionError.value = apiErrorMessage(cause, 'This prepared run could not be started. Please try again.')
  } finally {
    startingRun.value = false
  }
}

function newIdempotencyKey() {
  if (import.meta.client && typeof crypto.randomUUID === 'function') return `human-decision-${crypto.randomUUID()}`
  return `human-decision-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function submitHumanDecision(decision: ActivityRunHumanDecision, comment: string | null) {
  const run = selectedSnapshot.value?.run
  const activityRun = run?.current_activity_run
  if (!run || !activityRun || continuingRun.value) return

  const previousAttempt = humanDecisionAttempt.value
  const attempt = previousAttempt?.activityRunId === activityRun.id
    && previousAttempt.decision === decision
    && previousAttempt.comment === comment
    ? previousAttempt
    : {
        activityRunId: activityRun.id,
        idempotencyKey: newIdempotencyKey(),
        decision,
        comment,
      }
  humanDecisionAttempt.value = attempt
  continuingRun.value = true
  runActionError.value = ''

  let decisionRecorded = activityRun.next_action !== 'submit_human_decision'
  try {
    if (!decisionRecorded) {
      if (!activityRun.continuation_token) throw new Error('The activity continuation token is missing.')
      const continuedActivity = await api.activities.continueRun(activityRun.activity_id, activityRun.id, {
        continuation_token: activityRun.continuation_token,
        idempotency_key: attempt.idempotencyKey,
        result: {
          action: 'submit_human_decision',
          decision,
          comment,
        },
      })
      decisionRecorded = true
      replaceCurrentActivity(run.id, continuedActivity)
    }

    await continueSelectedPipeline()
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
    await continueSelectedPipeline()
    humanDecisionAttempt.value = null
  } catch (cause) {
    runActionError.value = apiErrorMessage(cause, 'The decision is recorded, but the pipeline still could not be resumed.')
  } finally {
    continuingRun.value = false
  }
}

async function continueSelectedPipeline() {
  const run = selectedSnapshot.value?.run
  if (!run) return
  const continued = await api.pipelines.continueRun(run.pipeline_id, run.id, { lease_token: null })
  await applyRunUpdates([continued])
}

function replaceCurrentActivity(runId: string, activityRun: NonNullable<PipelineRunResponse['current_activity_run']>) {
  if (!data.value) return
  data.value = {
    ...data.value,
    snapshots: data.value.snapshots.map(snapshot => snapshot.run.id === runId
      ? { ...snapshot, run: { ...snapshot.run, current_activity_run: activityRun } }
      : snapshot),
  }
}

async function updateRunDetails(updates: PipelineRunResponse[]) {
  if (!data.value) return
  const snapshots = await Promise.all(updates.map(async (run) => {
    const current = data.value?.snapshots.find(snapshot => snapshot.run.id === run.id)
    if (
      current
      && current.run.status === run.status
      && current.run.updated_at === run.updated_at
      && !needsTerminalEventRefresh(current)
    ) return { ...current, run }
    return loadSnapshot(run)
  }))
  const byId = new Map(snapshots.map(snapshot => [snapshot.run.id, snapshot]))
  data.value = {
    ...data.value,
    snapshots: data.value.snapshots.map(snapshot => byId.get(snapshot.run.id) ?? snapshot),
  }
  if (selectedSnapshot.value?.run.status === 'queued') await refreshRunReadiness()
  else clearRunReadiness()
}

async function refreshRunReadiness() {
  const run = selectedSnapshot.value?.run
  const request = ++readinessRequest
  if (!run || run.status !== 'queued') {
    clearRunReadiness()
    return
  }
  runReadinessLoading.value = true
  runReadinessError.value = ''
  try {
    const readiness = await api.pipelines.getRunReadiness(run.pipeline_id, run.id)
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

function toTableRow(snapshot: PipelineRunSnapshot, pipeline: string): RunTableRow {
  const { run, events } = snapshot
  return {
    id: run.id,
    pipelineId: run.pipeline_id,
    name: runPrompt(run).split('\n')[0]!.slice(0, 90),
    pipeline,
    status: run.status.replaceAll('_', ' ').replace(/^./, first => first.toUpperCase()),
    statusValue: run.status,
    created: formatDateTime(run.created_at),
    createdValue: run.created_at,
    tokens: runTokenCount(events).toLocaleString(),
    runBy: run.created_by,
  }
}

function rangeDuration(value: string) {
  const day = 24 * 60 * 60 * 1000
  if (value === 'last-week') return 7 * day
  if (value === 'last-month') return 30 * day
  if (value === 'last-quarter') return 90 * day
  return day
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date)
}

watch(
  () => [selectedSnapshot.value?.run.id, selectedSnapshot.value?.run.status],
  () => void refreshRunReadiness(),
)
onMounted(() => void refreshRunReadiness())

definePageMeta({ layout: 'app', alias: ['/'] })
useHead({ title: 'Runs · Looping Louie' })
</script>

<template>
  <PageShell title="Runs" description="Monitor pipeline executions, their event timeline, and human decisions.">
    <template #actions><UiButton to="/pipelines">New run</UiButton></template>
    <template #toolbar>
      <UiCatalogFilterBar
        v-model:status="runStatus"
        v-model:category="dateRange"
        v-model:sort="runSort"
        interactive
        :show-search="false"
        :status-options="runStatusOptions"
        :third-label="selectedDateRangeLabel"
        third-icon="calendar-blank"
        third-selection-type="radio"
        :third-options="dateRangeOptions"
      />
    </template>

    <UiAsyncStage :status="status" loading-label="Loading runs…" error-label="Runs could not be loaded." @retry="refresh">
      <div class="runs-content">
        <UiDataFreshnessNotice v-if="isStale" :loading="isPollingRefreshing" @retry="retryPolling" />
        <UiTable :columns="tableColumns" :rows="displayedRuns" caption="Pipeline runs">
          <template #cell-name="{ row }">
            <button type="button" class="runs-link" @click="selectRun(row as RunTableRow)">{{ row.name }}</button>
          </template>
          <template #empty>No runs match these filters.</template>
        </UiTable>
        <div v-if="selectedSnapshot?.run.status === 'prepared'" class="runs-action">
          <p>This run is prepared and will not execute until it is started.</p>
          <UiButton :loading="startingRun" @click="startPreparedRun">Start run</UiButton>
        </div>
        <WorkerReadinessPanel
          v-else-if="selectedSnapshot?.run.status === 'queued'"
          :readiness="runReadiness"
          :loading="runReadinessLoading"
          :error="runReadinessError"
          :workspace-name="readinessWorkspaceName"
          @retry="refreshRunReadiness"
        />
        <div v-else-if="selectedSnapshot?.run.status === 'claimed'" class="runs-action runs-action--informative" role="status">
          <div>
            <strong>Claimed by the runtime</strong>
            <p>The runtime has claimed this run and may still be preparing it before execution begins.</p>
          </div>
        </div>
        <HumanDecisionPanel
          v-if="selectedSnapshot?.run.status === 'waiting'"
          :activity="selectedActivity"
          :activity-run="selectedSnapshot.run.current_activity_run"
          :loading="continuingRun"
          @decide="submitHumanDecision"
          @continue="retryPipelineContinuation"
        />
        <p v-if="runActionError" class="runs-error" role="alert">{{ runActionError }}</p>
        <RunTimeline
          v-if="selectedSnapshot"
          :run="selectedSnapshot.run"
          :events="selectedSnapshot.events"
          :pipeline-name="data?.pipelineNames.get(selectedSnapshot.run.pipeline_id)"
          :activities-by-id="data?.activitiesById"
        />
      </div>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.runs-content { display: grid; gap: var(--ll-space-6); }
.runs-link { padding: 0; color: var(--ll-color-ink); background: transparent; border: 0; font: inherit; font-weight: 650; text-align: left; cursor: pointer; }
.runs-link:hover, .runs-link:focus-visible { color: var(--ll-color-primary); text-decoration: underline; }
.runs-action { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding: var(--ll-space-4); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); }
.runs-action--informative { justify-content: flex-start; }
.runs-action--informative > div { display: grid; gap: var(--ll-space-2); }
.runs-action p { margin: 0; color: var(--ll-color-text-muted); }
.runs-error { margin: 0; color: var(--ll-color-brand-ink); }
</style>
