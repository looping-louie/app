<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import RunPreviewDrawer from '~/components/runs/RunPreviewDrawer.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiDataFreshnessNotice from '~/components/ui/DataFreshnessNotice.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTable from '~/components/ui/Table.vue'
import type { PipelineRunResponse, PipelineRunStatus } from '~/types/api'
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
import { pipelineRunDetailRoute } from '~/utils/pipelineRunRoutes'

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
  { key: 'details', label: 'Details', align: 'end' as const },
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
const selectedDateRangeLabel = computed(() => (
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'All time'
))

const { data, status, refresh } = await useAsyncData('pipeline-runs-catalog', loadRuns)
watch([dateRange, requestedProjectId], () => void refresh())
const previewRunId = computed(() => typeof route.query.preview === 'string' ? route.query.preview : '')
const previewProjectId = computed(() => typeof route.query.previewProject === 'string' ? route.query.previewProject : '')
const previewPipelineId = computed(() => typeof route.query.previewPipeline === 'string' ? route.query.previewPipeline : '')
const previewSnapshot = computed(() => data.value?.snapshots.find(snapshot => (
  snapshot.run.id === previewRunId.value
  && snapshot.projectId === previewProjectId.value
  && snapshot.run.pipeline_id === previewPipelineId.value
)) ?? null)
const {
  isRefreshing: isPollingRefreshing,
  isStale,
  staleMessage,
  refresh: retryPolling,
} = usePipelineRunPolling(
  () => data.value?.snapshots ?? [],
  updateRunDetails,
  { refreshCatalog: refreshRunCatalog },
)
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
  void router.push({
    query: {
      ...route.query,
      preview: row.id,
      previewProject: row.projectId,
      previewPipeline: row.pipelineId,
    },
  })
}

function selectProject(value: string | string[]) {
  if (typeof value !== 'string' || value === selectedProjectValue.value) return
  void router.replace({ query: value === allProjectsValue ? {} : { project: value } })
}

async function updateRunDetails(updates: PipelineRunResponse[]) {
  if (!data.value) return
  data.value = {
    ...data.value,
    snapshots: await mergeSnapshots(data.value.snapshots, updates),
  }
}

function closePreview(open: boolean) {
  if (open) return
  const { preview, previewProject, previewPipeline, ...query } = route.query
  void router.replace({ query })
}

function openPreviewDetails() {
  const snapshot = previewSnapshot.value
  if (!snapshot) return
  void router.push(pipelineRunDetailRoute({
    projectId: snapshot.projectId,
    pipelineId: snapshot.run.pipeline_id,
    runId: snapshot.run.id,
  }))
}

function openRunDetails(row: RunTableRow) {
  void router.push(pipelineRunDetailRoute({
    projectId: row.projectId,
    pipelineId: row.pipelineId,
    runId: row.id,
  }))
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
          <template #cell-details="{ row }">
            <UiButton size="sm" variant="secondary" @click="openRunDetails(row as RunTableRow)">Open details</UiButton>
          </template>
          <template #empty>No runs match these filters.</template>
        </UiTable>
      </div>
    </UiAsyncStage>
    <RunPreviewDrawer
      :open="Boolean(previewSnapshot)"
      :snapshot="previewSnapshot"
      :project-name="previewSnapshot ? pipelineRunProjectName(projects, previewSnapshot.projectId) : ''"
      :pipeline-name="previewSnapshot ? data?.pipelineNames.get(previewSnapshot.run.pipeline_id) ?? previewSnapshot.run.pipeline_id : ''"
      @update:open="closePreview"
      @open-details="openPreviewDetails"
    />
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
</style>