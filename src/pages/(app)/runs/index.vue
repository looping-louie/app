<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import PipelinePreviewDrawer from '~/components/pipelines/PipelinePreviewDrawer.vue'
import RunPreviewDrawer from '~/components/runs/RunPreviewDrawer.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiDataFreshnessNotice from '~/components/ui/DataFreshnessNotice.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTable from '~/components/ui/Table.vue'
import type { PipelineRunResponse, PipelineRunStatus } from '~/types/api'
import {
  DEFAULT_PIPELINE_RUN_DATE_RANGE,
  filterPipelineRunSnapshots,
  findPipelineRunSummary,
  loadPipelineRunCatalog,
  mergePipelineRunSummaries,
  pipelineRunCreatedFrom,
  pipelineRunProjectName,
  runCatalogProjectIds,
  sortPipelineRunCatalogRows,
} from '~/utils/pipelineRunCatalog'
import {
  pipelineRunDisplayStatus,
  runPrompt,
  type PipelineRunOutcome,
  type PipelineRunStatusTone,
  type PipelineRunSummary,
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
  statusTone: PipelineRunStatusTone
  created: string
  createdFull: string
  createdValue: string
  runBy: string
}

const tableColumns = [
  { key: 'name', label: 'Initial prompt', width: '26%' },
  { key: 'project', label: 'Project', width: '14%', align: 'center' as const },
  { key: 'pipeline', label: 'Pipeline', width: '16%', align: 'center' as const },
  { key: 'status', label: 'Status', type: 'option' as const, align: 'center' as const },
  { key: 'created', label: 'Created', align: 'center' as const },
  { key: 'runBy', label: 'By', align: 'center' as const },
  { key: 'details', label: 'Details', align: 'center' as const },
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
const { formatCompactRelativeTime, formatDateTime } = useDateTime()
const relativeTimeNow = useMinuteClock()
const projectContext = useProjectContext()
const { error: projectError, projects, status: projectStatus } = projectContext
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
const drawerPipelineId = ref('')
const selectedDateRangeLabel = computed(() => (
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'All time'
))

const { data, status, refresh } = await useAsyncData('pipeline-runs-catalog', loadRuns)
watch([dateRange, requestedProjectId], () => void refresh())
const previewRunId = computed(() => typeof route.query.preview === 'string' ? route.query.preview : '')
const previewProjectId = computed(() => typeof route.query.previewProject === 'string' ? route.query.previewProject : '')
const previewPipelineId = computed(() => typeof route.query.previewPipeline === 'string' ? route.query.previewPipeline : '')
const previewSnapshot = computed(() => findPipelineRunSummary(
  data.value?.summaries ?? [],
  previewRunId.value,
  previewProjectId.value,
  previewPipelineId.value,
))
const {
  isRefreshing: isPollingRefreshing,
  isStale,
  staleMessage,
  refresh: retryPolling,
} = usePipelineRunPolling(
  () => data.value?.summaries ?? [],
  updateRunDetails,
  { refreshCatalog: refreshRunCatalog },
)
const displayedRuns = computed(() => {
  const createdFrom = pipelineRunCreatedFrom(dateRange.value)
  const cutoff = createdFrom ? Date.parse(createdFrom) : undefined
  const rows = filterPipelineRunSnapshots(data.value?.summaries ?? [], runStatus.value, cutoff)
    .map(snapshot => toTableRow(snapshot, data.value?.pipelineNames.get(snapshot.run.pipeline_id) ?? snapshot.run.pipeline_id))
  return sortPipelineRunCatalogRows(rows, runSort.value)
})

async function loadRuns() {
  if (projectStatus.value === 'error') throw new Error(projectError.value || 'Projects could not be loaded.')
  const scopedProjectId = requestedProjectId.value
  const projectIds = runCatalogProjectIds(projects.value, scopedProjectId)
  if (!projectIds.length) return { summaries: [], pipelineNames: new Map<string, string>(), failedProjectIds: [] }
  const createdFrom = pipelineRunCreatedFrom(dateRange.value)
  return loadPipelineRunCatalog(
    projectIds,
    offset => api.pipelines.list({ offset }),
    (projectId, offset) => api.pipelineRuns.list(projectId, {
      offset,
      ...(createdFrom ? { created_from: createdFrom } : {}),
    }),
  )
}

async function retryCatalog() {
  if (projectStatus.value === 'error') await projectContext.initialize(true)
  await refresh()
}

const partialCoverageMessage = computed(() => {
  const failedIds = data.value?.failedProjectIds ?? []
  if (!failedIds.length) return ''
  const names = failedIds.map(id => pipelineRunProjectName(projects.value, id))
  return `Runs could not be loaded for ${names.join(', ')}. The catalog is incomplete.`
})

const emptyMessage = computed(() => {
  if (!projects.value.length) return 'No projects are available yet.'
  if (!(data.value?.summaries.length)) return 'No runs have been created yet.'
  return 'No runs match these filters.'
})

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

function openPipelinePreview(row: RunTableRow) {
  drawerPipelineId.value = row.pipelineId
}

function closePipelinePreview(open: boolean) {
  if (!open) drawerPipelineId.value = ''
}

function selectProject(value: string | string[]) {
  if (typeof value !== 'string' || value === selectedProjectValue.value) return
  void router.replace({ query: value === allProjectsValue ? {} : { project: value } })
}

function updateRunDetails(updates: PipelineRunResponse[]) {
  if (!data.value) return
  data.value = {
    ...data.value,
    summaries: mergePipelineRunSummaries(data.value.summaries, updates),
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

function toTableRow(snapshot: PipelineRunSummary, pipeline: string): RunTableRow {
  const { run } = snapshot
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
    statusTone: displayStatus.tone,
    created: formatCompactRelativeTime(run.created_at, relativeTimeNow.value),
    createdFull: formatDateTime(run.created_at),
    createdValue: run.created_at,
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

    <UiAsyncStage :status="status" loading-label="Loading runs…" :error-label="projectError || 'Runs could not be loaded.'" @retry="retryCatalog">
      <div class="runs-content">
        <div v-if="partialCoverageMessage" class="runs-coverage-warning" role="alert">
          <span>{{ partialCoverageMessage }}</span>
          <UiButton size="sm" variant="stroke" @click="() => refresh()">Retry</UiButton>
        </div>
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
          <template #cell-pipeline="{ row }">
            <UiPill
              clickable
              aria-haspopup="dialog"
              :aria-label="`Inspect pipeline ${(row as RunTableRow).pipeline}`"
              @click.stop="openPipelinePreview(row as RunTableRow)"
            >{{ (row as RunTableRow).pipeline }}</UiPill>
          </template>
          <template #cell-status="{ row }">
            <UiPill :focusable="false" :tone="(row as RunTableRow).statusTone">
              <template v-if="(row as RunTableRow).outcome === 'action-required'" #icon>
                <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm8-120v40a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm4,72a12,12,0,1,1-12-12A12,12,0,0,1,140,168Z" />
                </svg>
              </template>
              {{ (row as RunTableRow).status }}
            </UiPill>
          </template>
          <template #cell-created="{ row }">
            <UiPill
              :tooltip="(row as RunTableRow).createdFull"
              :aria-label="`${(row as RunTableRow).created}, created ${(row as RunTableRow).createdFull}`"
            >{{ (row as RunTableRow).created }}</UiPill>
          </template>
          <template #cell-details="{ row }">
            <UiButton
              size="sm"
              variant="secondary"
              icon-only
              aria-label="Open details"
              title="Open details"
              @click="selectRun(row as RunTableRow)"
            >
              <template #leading>
                <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
                </svg>
              </template>
            </UiButton>
          </template>
          <template #empty>{{ emptyMessage }}</template>
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
    <PipelinePreviewDrawer
      :open="Boolean(drawerPipelineId)"
      :pipeline-id="drawerPipelineId"
      @update:open="closePipelinePreview"
    />
  </PageShell>
</template>

<style scoped>
.runs-content { display: grid; gap: var(--ll-space-6); }
.runs-coverage-warning { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding: var(--ll-space-3) var(--ll-space-4); color: var(--ll-color-brand-ink); background: var(--ll-color-red-100); border-radius: var(--ll-radius-structural); }
.runs-link { padding: 0; color: var(--ll-color-ink); background: transparent; border: 0; font: inherit; font-weight: 650; text-align: left; cursor: pointer; }
.runs-link:hover, .runs-link:focus-visible { color: var(--ll-color-primary); text-decoration: underline; }
.runs-link--action { color: var(--ll-color-brand-ink); }
</style>
