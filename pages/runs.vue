<script setup lang="ts">
import CatalogShell from '~/components/catalog/CatalogShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiTable from '~/components/ui/Table.vue'
import type { LoopRunResponse, PipelineResponse } from '~/types/api'
import { isLoopActivity } from '~/types/api'

interface RunTableRow extends Record<string, unknown> {
  id: string
  name: string
  project: string
  status: string
  statusValue: LoopRunResponse['status']
  runningSince: string
  runningSinceValue: string
  tokensConsumed: string
  runBy: string
}

const tableColumns = [
  { key: 'name', label: 'Name', width: '25%' },
  { key: 'project', label: 'Project', width: '18%' },
  { key: 'status', label: 'Status', type: 'option' as const },
  { key: 'runningSince', label: 'Running since' },
  { key: 'tokensConsumed', label: 'Tokens consumed', align: 'end' as const },
  { key: 'runBy', label: 'Run by' },
]

const runStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'stopped', label: 'Stopped' },
]

const dateRangeOptions = [
  { value: 'last-24-hours', label: 'Last 24 hours' },
  { value: 'last-week', label: 'Last week' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-quarter', label: 'Last quarter' },
]

const runStatus = ref('all')
const dateRange = ref('last-24-hours')
const runSort = ref('newest')
const api = useApiClient()
const { resolve: resolveActivities } = usePipelineActivities()

const selectedDateRangeLabel = computed(() => (
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'Last 24 hours'
))

const { data, status, refresh } = await useAsyncData(
  'runs-catalog',
  async () => {
    const pipelineResponse = await api.pipelines.list({ offset: 0 })
    const pipelineActivities = await Promise.all(pipelineResponse.items.map(async pipeline => ({
      pipeline,
      activities: await resolveActivities(pipeline.steps),
    })))
    const loopActivityIds = [...new Set(pipelineActivities.flatMap(item => (
      item.activities.filter(isLoopActivity).map(activity => activity.id)
    )))]
    const runPages = await Promise.all(loopActivityIds.map(async activityId => ({
      activityId,
      page: await api.activities.listRuns(activityId, { offset: 0 }),
    })))
    const runsByActivity = new Map(runPages.map(({ activityId, page }) => [activityId, page.items]))

    return pipelineActivities.flatMap(({ pipeline, activities }) => {
      const ids = activities.filter(isLoopActivity).map(activity => activity.id)
      return ids.flatMap(activityId => (
        (runsByActivity.get(activityId) ?? []).map(run => toTableRow(run, pipeline))
      ))
    })
  },
)

const displayedRuns = computed(() => {
  const cutoff = Date.now() - rangeDuration(dateRange.value)
  const filtered = (data.value ?? []).filter(run => (
    (runStatus.value === 'all' || run.statusValue === runStatus.value)
    && Date.parse(run.runningSinceValue) >= cutoff
  ))

  return [...filtered].sort((first, second) => {
    if (runSort.value === 'alphabetical-desc') return second.name.localeCompare(first.name)
    if (runSort.value === 'oldest') return Date.parse(first.runningSinceValue) - Date.parse(second.runningSinceValue)
    if (runSort.value === 'newest') return Date.parse(second.runningSinceValue) - Date.parse(first.runningSinceValue)
    return first.name.localeCompare(second.name)
  })
})

function toTableRow(run: LoopRunResponse, pipeline: PipelineResponse): RunTableRow {
  return {
    id: `${pipeline.id}:${run.loop_id}:${run.id}`,
    name: run.input.trim().split('\n')[0] || run.id,
    project: pipeline.title,
    status: runStatusLabel(run.status),
    statusValue: run.status,
    runningSince: formatDateTime(run.created_at),
    runningSinceValue: run.created_at,
    tokensConsumed: formatTokens(run.payload),
    runBy: run.created_by,
  }
}

function runStatusLabel(value: LoopRunResponse['status']) {
  return {
    in_progress: 'In progress',
    completed: 'Completed',
    failed: 'Failed',
    stopped: 'Stopped',
  }[value]
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
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatTokens(payload: Record<string, unknown>) {
  const usage = payload.usage && typeof payload.usage === 'object'
    ? payload.usage as Record<string, unknown>
    : undefined
  const direct = numericValue(payload.tokens_consumed) ?? numericValue(payload.total_tokens) ?? numericValue(usage?.total_tokens)
  if (direct !== undefined) return new Intl.NumberFormat('en-US').format(direct)

  const input = numericValue(usage?.input_tokens)
  const output = numericValue(usage?.output_tokens)
  if (input === undefined && output === undefined) return '—'
  return new Intl.NumberFormat('en-US').format((input ?? 0) + (output ?? 0))
}

function numericValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

definePageMeta({
  layout: 'app',
  alias: ['/', '/app/runs'],
})
useHead({ title: 'Runs · Looping Louie' })
</script>

<template>
  <CatalogShell
    title="Runs"
    description="Monitor pipeline executions, resource use, and ownership from one place."
    :status="status"
    loading-label="Loading runs…"
    error-label="Runs could not be loaded."
    @retry="refresh"
  >
    <template #actions><UiButton>New run</UiButton></template>
    <template #filters>
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

    <UiTable :columns="tableColumns" :rows="displayedRuns" caption="Pipeline runs">
      <template #empty>No runs match these filters.</template>
    </UiTable>
  </CatalogShell>
</template>
