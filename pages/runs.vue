<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import RunTimeline from '~/components/runs/RunTimeline.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiTable from '~/components/ui/Table.vue'
import type { GateDecisionRequest, PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { collectApiPages } from '~/utils/apiPagination'
import { runPrompt, runTokenCount } from '~/utils/pipelineRuns'

interface RunTableRow extends Record<string, unknown> {
  id: string
  pipelineId: string
  name: string
  pipeline: string
  status: string
  statusValue: PipelineRunResponse['status']
  started: string
  startedValue: string
  tokens: string
  runBy: string
}

const tableColumns = [
  { key: 'name', label: 'Initial prompt', width: '30%' },
  { key: 'pipeline', label: 'Pipeline', width: '18%' },
  { key: 'status', label: 'Status', type: 'option' as const },
  { key: 'started', label: 'Started' },
  { key: 'tokens', label: 'Tokens', align: 'end' as const },
  { key: 'runBy', label: 'Run by' },
]

const runStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'running', label: 'Running' },
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
const runStatus = ref('all')
const dateRange = ref('last-24-hours')
const runSort = ref('newest')
const resolvedGates = ref(new Set<string>())
const decidingGate = ref('')
const decisionError = ref('')

const selectedDateRangeLabel = computed(() => (
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'Last 24 hours'
))

const { data, status, refresh } = await useAsyncData('pipeline-runs-catalog', loadRuns)
const runPolling = usePipelineRunPolling(
  () => data.value?.runs ?? [],
  updateRunDetails,
)
const selectedRun = computed(() => data.value?.runs.find(run => run.id === route.query.run) ?? null)
const displayedRuns = computed(() => {
  const cutoff = Date.now() - rangeDuration(dateRange.value)
  const rows = (data.value?.runs ?? [])
    .filter(run => (runStatus.value === 'all' || run.status === runStatus.value) && Date.parse(run.created_at) >= cutoff)
    .map(run => toTableRow(run, data.value?.pipelineNames.get(run.pipeline_id) ?? run.pipeline_id))
  return rows.sort((first, second) => {
    if (runSort.value === 'alphabetical-desc') return second.name.localeCompare(first.name)
    if (runSort.value === 'oldest') return Date.parse(first.startedValue) - Date.parse(second.startedValue)
    if (runSort.value === 'newest') return Date.parse(second.startedValue) - Date.parse(first.startedValue)
    return first.name.localeCompare(second.name)
  })
})

async function loadRuns() {
  const pipelines = await collectApiPages(offset => api.pipelines.list({ offset }))
  const pages = await Promise.all(pipelines.map(async pipeline => ({
    pipeline,
    runs: await collectApiPages(offset => api.pipelines.listRuns(pipeline.id, { offset })),
  })))
  const summaries = pages.flatMap(item => item.runs)
  const details = await Promise.all(summaries.map(run => api.pipelines.getRun(run.pipeline_id, run.id)))
  const selectedPipeline = typeof route.query.pipeline === 'string' ? route.query.pipeline : ''
  const selectedId = typeof route.query.run === 'string' ? route.query.run : ''
  if (selectedPipeline && selectedId && !details.some(run => run.id === selectedId)) {
    details.push(await api.pipelines.getRun(selectedPipeline, selectedId))
  }
  return {
    runs: details,
    pipelineNames: new Map(pipelines.map(pipeline => [pipeline.id, pipeline.name])),
  }
}

function selectRun(row: RunTableRow) {
  decisionError.value = ''
  void router.replace({ query: { ...route.query, pipeline: row.pipelineId, run: row.id } })
}

async function decideGate(event: PipelineRunEventResponse, decision: GateDecisionRequest) {
  if (!selectedRun.value || !event.step_id || decidingGate.value) return
  decidingGate.value = event.step_id
  decisionError.value = ''
  try {
    await api.pipelines.decideGate(selectedRun.value.pipeline_id, selectedRun.value.id, event.step_id, decision)
    resolvedGates.value = new Set([...resolvedGates.value, event.step_id])
    await runPolling.refreshRun(selectedRun.value)
  } catch (cause) {
    decisionError.value = apiErrorMessage(cause, 'This gate could not be resolved. Please try again.')
  } finally {
    decidingGate.value = ''
  }
}

function updateRunDetails(updates: PipelineRunResponse[]) {
  if (!data.value) return
  const byId = new Map(updates.map(run => [run.id, run]))
  data.value = {
    ...data.value,
    runs: data.value.runs.map(run => byId.get(run.id) ?? run),
  }
}

function toTableRow(run: PipelineRunResponse, pipeline: string): RunTableRow {
  return {
    id: run.id,
    pipelineId: run.pipeline_id,
    name: runPrompt(run).split('\n')[0]!.slice(0, 90),
    pipeline,
    status: run.status.replace(/^./, first => first.toUpperCase()),
    statusValue: run.status,
    started: formatDateTime(run.started_at ?? run.created_at),
    startedValue: run.started_at ?? run.created_at,
    tokens: runTokenCount(run).toLocaleString(),
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

definePageMeta({ layout: 'app', alias: ['/', '/app/runs'] })
useHead({ title: 'Runs · Looping Louie' })
</script>

<template>
  <PageShell title="Runs" description="Monitor pipeline executions, their event timeline, and human decisions.">
    <template #actions><UiButton to="/app/pipelines">New run</UiButton></template>
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
        <UiTable :columns="tableColumns" :rows="displayedRuns" caption="Pipeline runs">
          <template #cell-name="{ row }">
            <button type="button" class="runs-link" @click="selectRun(row as RunTableRow)">{{ row.name }}</button>
          </template>
          <template #empty>No runs match these filters.</template>
        </UiTable>
        <p v-if="decisionError" class="runs-error" role="alert">{{ decisionError }}</p>
        <RunTimeline
          v-if="selectedRun"
          :run="selectedRun"
          :resolved-gates="resolvedGates"
          :deciding-gate="decidingGate"
          @decide="decideGate"
        />
      </div>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.runs-content { display: grid; gap: var(--ll-space-6); }
.runs-link { padding: 0; color: var(--ll-color-ink); background: transparent; border: 0; font: inherit; font-weight: 650; text-align: left; cursor: pointer; }
.runs-link:hover, .runs-link:focus-visible { color: var(--ll-color-primary); text-decoration: underline; }
.runs-error { margin: 0; color: var(--ll-color-brand-ink); }
</style>
