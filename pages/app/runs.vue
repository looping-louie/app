<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTable from '~/components/ui/Table.vue'

interface PipelineLoopStep {
  type: 'loop'
  loop_id: string
}

interface PipelineHumanGateStep {
  type: 'human_gate'
  gate_type: 'approval' | 'quiz'
}

interface PipelineSummary {
  id: string
  title: string
  steps: Array<PipelineLoopStep | PipelineHumanGateStep>
}

interface PipelineListResponse {
  items: PipelineSummary[]
  total: number
}

interface LoopRun {
  id: string
  loop_id: string
  input: string
  status: 'in_progress' | 'failed' | 'completed' | 'stopped'
  created_at: string
  created_by: string
  payload: Record<string, unknown>
}

interface LoopRunListResponse {
  items: LoopRun[]
  total: number
}

interface RunTableRow extends Record<string, unknown> {
  id: string
  name: string
  project: string
  status: string
  statusValue: LoopRun['status']
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

const selectedDateRangeLabel = computed(() => (
  dateRangeOptions.find(option => option.value === dateRange.value)?.label ?? 'Last 24 hours'
))

const { data, status, error, refresh } = await useAsyncData(
  'runs-catalog',
  async () => {
    const pipelineResponse = await $fetch<PipelineListResponse>('/api/v1/pipelines?offset=0')
    const loopIds = [...new Set(
      pipelineResponse.items.flatMap(pipeline => pipeline.steps.flatMap(step => (
        step.type === 'loop' ? [step.loop_id] : []
      ))),
    )]

    const runPages = await Promise.all(loopIds.map(async loopId => ({
      loopId,
      page: await $fetch<LoopRunListResponse>(`/api/v1/loops/${encodeURIComponent(loopId)}/runs?offset=0`),
    })))
    const runsByLoop = new Map(runPages.map(({ loopId, page }) => [loopId, page.items]))

    return pipelineResponse.items.flatMap(pipeline => {
      const pipelineLoopIds = [...new Set(pipeline.steps.flatMap(step => (
        step.type === 'loop' ? [step.loop_id] : []
      )))]

      return pipelineLoopIds.flatMap(loopId => (
        (runsByLoop.get(loopId) ?? []).map(run => toTableRow(run, pipeline))
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

function toTableRow(run: LoopRun, pipeline: PipelineSummary): RunTableRow {
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

function runStatusLabel(value: LoopRun['status']) {
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

definePageMeta({ layout: 'app' })
useHead({ title: 'Runs · Looping Louie' })
</script>

<template>
  <UiContainer size="wide" class="runs-page">
    <UiHeadingBlock layout="split" size="section" align="start" class="runs-heading">
      <template #title><h1>Runs</h1></template>
      <template #description><p>Monitor pipeline executions, resource use, and ownership from one place.</p></template>
      <template #aside>
        <div class="runs-heading__actions"><UiButton>New run</UiButton></div>
      </template>
    </UiHeadingBlock>

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
      class="runs-filters"
    />

    <div v-if="status === 'pending'" class="runs-state" role="status">Loading runs…</div>
    <div v-else-if="error" class="runs-state runs-state--error" role="alert">
      <span>Runs could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="bottom" class="runs-stage">
      <UiTable :columns="tableColumns" :rows="displayedRuns" caption="Pipeline runs">
        <template #empty>No runs match these filters.</template>
      </UiTable>
    </UiSectionStage>
  </UiContainer>
</template>

<style scoped>
.runs-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.runs-heading {
  margin-bottom: var(--ll-space-6);
}

.runs-heading__actions {
  display: flex;
  justify-content: flex-end;
}

.runs-filters {
  margin-bottom: var(--ll-space-10);
}

.runs-stage :deep(.ui-section-stage__shell) {
  width: 100%;
}

.runs-state {
  display: flex;
  min-height: 10rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ll-radius-structural);
  font-size: var(--ll-text-sm);
}

.runs-state--error {
  color: var(--ll-color-brand-ink);
}

.runs-state button {
  padding: var(--ll-space-2) var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  cursor: pointer;
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-control);
}
</style>
