<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import HumanDecisionPanel from '~/components/runs/HumanDecisionPanel.vue'
import RunTimeline from '~/components/runs/RunTimeline.vue'
import WorkerReadinessPanel from '~/components/runs/WorkerReadinessPanel.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiDataFreshnessNotice from '~/components/ui/DataFreshnessNotice.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTable from '~/components/ui/Table.vue'
import type { ActivityResponse, ActivityRunHumanDecision, PipelineRunReadinessResponse, PipelineRunResponse, PipelineRunStatus } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { collectApiPages } from '~/utils/apiPagination'
import {
  collectProjectPipelineRuns,
  DEFAULT_PIPELINE_RUN_DATE_RANGE,
  filterPipelineRunSnapshots,
  pipelineRunCreatedFrom,
  pipelineRunProjectName,
  runCatalogProjectIds,
} from '~/utils/pipelineRunCatalog'
import {
  pipelineRunDisplayStatus,
  runPrompt,
  runTokenCount,
  type PipelineRunOutcome,
  type PipelineRunSnapshot,
} from '~/utils/pipelineRuns'

interface RunTableRow extends Record<string, unknown> {
  id: string
  projectId: string
  pipelineId: string
  name: string
  project: string
  pipeline: string
  status: string
  outcome: PipelineRunOutcome
  created: string
  createdValue: string
  tokens: string
  runBy: string
}

const tableColumns = [
  { key: 'name', label: 'Initial prompt', width: '26%' },
  { key: 'project', label: 'Project', width: '14%' },
  { key: 'pipeline', label: 'Pipeline', width: '16%' },
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
  { value: 'all-time', label: 'All time' },
  { value: 'last-24-hours', label: 'Last 24 hours' },
  { value: 'last-week', label: 'Last week' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-quarter', label: 'Last quarter' },
]

const route = useRoute()
const router = useRouter()
const api = useApiClient()
const { load: loadSnapshot, merge: mergeSnapshots } = usePipelineRunSnapshots()
const { formatDateTime } = useDateTime()
const { projects } = useProjectContext()
const { refresh: refreshHumanGateNotifications } = useHumanGateNotifications()
const allProjectsValue = '__all_projects__'
const requestedProjectId = computed(() => {
  const requested = typeof route.query.project === 'string' ? route.query.project : ''
  return projects.value.some(project => project.id === requested) ? requested : ''
})
const projectOptions = computed(() => [
  { value: allProjectsValue, label: 'All projects' },
  ...projects.value.map(project => ({ value: project.id, label: project.name })),
])
const selectedProjectValue = computed(() => requestedProjectId.value || allProjectsValue)
const selectedProjectName = computed(() => (
  projects.value.find(project => project.id === requestedProjectId.value)?.name ?? 'All projects'
))
const runStatus = ref<PipelineRunStatus | 'all'>('all')
const dateRange = ref(DEFAULT_PIPELINE_RUN_DATE_RANGE)
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
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'All time'
))

const { data, status, refresh } = await useAsyncData('pipeline-runs-catalog', loadRuns)
watch([dateRange, requestedProjectId], () => void refresh())
const selectedSnapshot = computed(() => data.value?.snapshots.find(snapshot => snapshot.run.id === route.query.run) ?? null)
const {
  applyRunUpdates,
  isRefreshing: isPollingRefreshing,
  isStale,
  staleMessage,
  refresh: retryPolling,
} = usePipelineRunPolling(
  () => data.value?.snapshots ?? [],
  updateRunDetails,
  { refreshCatalog: refreshRunCatalog },
)
const readinessProjectName = computed(() => {
  const project = projects.value.find(candidate => candidate.id === runReadiness.value?.project_id)
  return project?.name ?? 'Current project'
})
const selectedActivity = computed<ActivityResponse | null>(() => {
  const activityId = selectedSnapshot.value?.run.current_activity_run?.activity_id
  return activityId ? data.value?.activitiesById.get(activityId) ?? null : null
})
const displayedRuns = computed(() => {
  const createdFrom = pipelineRunCreatedFrom(dateRange.value)
  const cutoff = createdFrom ? Date.parse(createdFrom) : undefined
  const rows = filterPipelineRunSnapshots(data.value?.snapshots ?? [], runStatus.value, cutoff)
    .map(snapshot => toTableRow(snapshot, data.value?.pipelineNames.get(snapshot.run.pipeline_id) ?? snapshot.run.pipeline_id))
  return rows.sort((first, second) => {
    if (runSort.value === 'alphabetical-desc') return second.name.localeCompare(first.name)
    if (runSort.value === 'oldest') return Date.parse(first.createdValue) - Date.parse(second.createdValue)
    if (runSort.value === 'newest') return Date.parse(second.createdValue) - Date.parse(first.createdValue)
    return first.name.localeCompare(second.name)
  })
})

async function loadRuns() {
  const scopedProjectId = requestedProjectId.value
  const projectIds = runCatalogProjectIds(projects.value, scopedProjectId)
  if (!projectIds.length) return { snapshots: [], pipelineNames: new Map(), activitiesById: new Map() }
  const createdFrom = pipelineRunCreatedFrom(dateRange.value)
  const [pipelines, discoveredRuns] = await Promise.all([
    collectApiPages(offset => api.pipelines.list({ offset })),
    collectProjectPipelineRuns(projectIds, (projectId, offset) => api.pipelineRuns.list(projectId, {
      offset,
      ...(createdFrom ? { created_from: createdFrom } : {}),
    })),
  ])
  const selectedPipeline = typeof route.query.pipeline === 'string' ? route.query.pipeline : ''
  const selectedId = typeof route.query.run === 'string' ? route.query.run : ''
  if (scopedProjectId && selectedPipeline && selectedId) {
    const selectedRun = await api.pipelines.getRun(selectedPipeline, selectedId, scopedProjectId)
    const selectedIndex = discoveredRuns.findIndex(({ run }) => run.id === selectedId)
    const selectedProjectRun = { projectId: scopedProjectId, run: selectedRun }
    if (selectedIndex === -1) discoveredRuns.push(selectedProjectRun)
    else discoveredRuns.splice(selectedIndex, 1, selectedProjectRun)
  }
  return {
    snapshots: await Promise.all(discoveredRuns.map(({ projectId, run }) => loadSnapshot(run, projectId))),
    pipelineNames: new Map(pipelines.map(pipeline => [pipeline.id, pipeline.name])),
    activitiesById: new Map(pipelines.flatMap(pipeline => pipeline.steps.map(step => [step.id, step] as const))),
  }
}

async function refreshRunCatalog() {
  await refresh()
}

function selectRun(row: RunTableRow) {
  runActionError.value = ''
  void router.replace({ query: { project: row.projectId, pipeline: row.pipelineId, run: row.id } })
}

function selectProject(value: string | string[]) {
  if (typeof value !== 'string' || value === selectedProjectValue.value) return
  void router.replace({ query: value === allProjectsValue ? {} : { project: value } })
}

async function startPreparedRun() {
  const snapshot = selectedSnapshot.value
  const run = snapshot?.run
  if (!snapshot || !run || run.status !== 'prepared' || startingRun.value) return
  startingRun.value = true
  runActionError.value = ''
  try {
    const started = await api.pipelines.startRun(run.pipeline_id, run.id, snapshot.projectId)
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
  const snapshot = selectedSnapshot.value
  const run = snapshot?.run
  const activityRun = run?.current_activity_run
  if (!snapshot || !run || !activityRun || continuingRun.value) return

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
      const continuedActivity = await api.activities.continueRun(activityRun.activity_id, activityRun.id, snapshot.projectId, {
        pipeline_run_id: run.id,
        lease_token: null,
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
  const snapshot = selectedSnapshot.value
  const run = snapshot?.run
  if (!snapshot || !run) return
  const continued = await api.pipelines.continueRun(run.pipeline_id, run.id, snapshot.projectId, { lease_token: null })
  await applyRunUpdates([continued])
  await refreshHumanGateNotifications()
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
  data.value = {
    ...data.value,
    snapshots: await mergeSnapshots(data.value.snapshots, updates),
  }
  if (selectedSnapshot.value?.run.status === 'queued') await refreshRunReadiness()
  else clearRunReadiness()
}

async function refreshRunReadiness() {
  const snapshot = selectedSnapshot.value
  const run = snapshot?.run
  const request = ++readinessRequest
  if (!snapshot || !run || run.status !== 'queued') {
    clearRunReadiness()
    return
  }
  runReadinessLoading.value = true
  runReadinessError.value = ''
  try {
    const readiness = await api.pipelines.getRunReadiness(run.pipeline_id, run.id, snapshot.projectId)
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
  const displayStatus = pipelineRunDisplayStatus(run)
  return {
    id: run.id,
    projectId: snapshot.projectId,
    pipelineId: run.pipeline_id,
    name: runPrompt(run).split('\n')[0]!.slice(0, 90),
    project: pipelineRunProjectName(projects.value, snapshot.projectId),
    pipeline,
    status: displayStatus.label,
    outcome: displayStatus.outcome,
    created: formatDateTime(run.created_at),
    createdValue: run.created_at,
    tokens: runTokenCount(events).toLocaleString(),
    runBy: run.created_by,
  }
}

watch(
  () => [selectedSnapshot.value?.run.id, selectedSnapshot.value?.run.status],
  () => void refreshRunReadiness(),
)
onMounted(() => void refreshRunReadiness())
watch(
  () => [route.hash, selectedSnapshot.value?.run.id, selectedSnapshot.value?.run.status],
  async () => {
    if (!import.meta.client || route.hash !== '#human-gate' || selectedSnapshot.value?.run.status !== 'waiting') return
    await nextTick()
    document.getElementById('human-gate')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
  { immediate: true },
)

definePageMeta({ layout: 'app', alias: ['/'] })
useHead({ title: 'Runs · Looping Louie' })
</script>

<template>
  <PageShell title="Runs" description="Monitor pipeline executions, their event timeline, and human decisions.">
    <template #actions>
      <UiPill
        v-if="projects.length"
        :model-value="selectedProjectValue"
        :options="projectOptions"
        clickable
        aria-haspopup="listbox"
        dropdown-label="Projects"
        aria-label="Filter runs by project"
        @update:model-value="selectProject"
      >
        {{ selectedProjectName }}
      </UiPill>
      <UiButton to="/pipelines">New run</UiButton>
    </template>
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
        <UiDataFreshnessNotice v-if="isStale" :description="staleMessage" :loading="isPollingRefreshing" @retry="retryPolling" />
        <UiTable :columns="tableColumns" :rows="displayedRuns" caption="Pipeline runs">
          <template #cell-name="{ row }">
            <button
              type="button"
              class="runs-link"
              :class="{ 'runs-link--action': (row as RunTableRow).outcome === 'action-required' }"
              @click="selectRun(row as RunTableRow)"
            >{{ row.name }}</button>
          </template>
          <template #cell-status="{ row }">
            <span
              class="runs-status"
              :class="`runs-status--${(row as RunTableRow).outcome}`"
            >
              <svg v-if="(row as RunTableRow).outcome === 'action-required'" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm8-120v40a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm4,72a12,12,0,1,1-12-12A12,12,0,0,1,140,168Z" />
              </svg>
              {{ (row as RunTableRow).status }}
            </span>
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
          :project-name="readinessProjectName"
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
.runs-link--action { color: var(--ll-color-brand-ink); }
.runs-status { display: inline-flex; align-items: center; gap: var(--ll-space-2); padding: 0.25rem 0.625rem; border-radius: var(--ll-radius-pill); font-size: var(--ll-text-xs); font-weight: 650; line-height: 1.35; white-space: nowrap; }
.runs-status svg { width: 0.9rem; height: 0.9rem; }
.runs-status--running { color: var(--ll-color-primary-depth); background: var(--ll-color-blue-100); }
.runs-status--action-required, .runs-status--failed { color: var(--ll-color-brand-ink); background: var(--ll-color-red-100); }
.runs-status--prepared, .runs-status--succeeded { color: var(--ll-color-ink); background: var(--ll-color-highlight); }
.runs-action { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding: var(--ll-space-4); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); }
.runs-action--informative { justify-content: flex-start; }
.runs-action--informative > div { display: grid; gap: var(--ll-space-2); }
.runs-action p { margin: 0; color: var(--ll-color-text-muted); }
.runs-error { margin: 0; color: var(--ll-color-brand-ink); }
</style>
