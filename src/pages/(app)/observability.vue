<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiChartCard from '~/components/ui/ChartCard.vue'
import UiDataFreshnessNotice from '~/components/ui/DataFreshnessNotice.vue'
import UiMetricCard from '~/components/ui/MetricCard.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import UiTable from '~/components/ui/Table.vue'
import { collectApiPages } from '~/utils/apiPagination'
import { observabilityDistributions, observabilityLogs, observabilityMetrics, type ObservabilityDistributionItem } from '~/utils/observability'
import { pipelineRunDetailRoute } from '~/utils/pipelineRunRoutes'

const activeView = ref('metrics')
const dateRange = ref('7d')
const api = useApiClient()
const { load: loadSnapshot, merge: mergeSnapshots } = usePipelineRunSnapshots()
const { projects } = useProjectContext()

const viewOptions = [
  { value: 'metrics', label: 'Metrics' },
  { value: 'logs', label: 'Logs' },
]
const rangeOptions = [
  { value: '1d', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
]
const logColumns = [
  { key: 'created', label: 'Time' },
  { key: 'status', label: 'Status', type: 'option' as const },
  { key: 'run', label: 'Run', width: '20%' },
  { key: 'phase', label: 'Turn' },
  { key: 'model', label: 'Model' },
  { key: 'duration', label: 'Duration' },
  { key: 'tokens', label: 'Tokens', align: 'end' as const },
  { key: 'activityRun', label: 'Activity run' },
  { key: 'error', label: 'Error', width: '25%' },
]

const { data: snapshots, status, refresh } = await useAsyncData('observability-runs', async () => {
  return loadObservabilitySnapshots()
})
watch(dateRange, () => void refresh())
const {
  isRefreshing: isPollingRefreshing,
  isStale,
  staleMessage,
  refresh: retryPolling,
} = usePipelineRunPolling(
  () => snapshots.value ?? [],
  async (updates) => {
    snapshots.value = await mergeSnapshots(snapshots.value ?? [], updates)
  },
  { refreshCatalog: refreshObservabilityCatalog },
)

async function listRunsInRange() {
  const createdFrom = new Date(Date.now() - rangeDuration(dateRange.value)).toISOString()
  return Promise.all(projects.value.map(async project => ({
    projectId: project.id,
    runs: await collectApiPages(offset => api.pipelineRuns.list(project.id, { offset, created_from: createdFrom })),
  })))
}

async function loadObservabilitySnapshots() {
  const projectRuns = await listRunsInRange()
  return Promise.all(projectRuns.flatMap(({ projectId, runs }) => (
    runs.map(run => loadSnapshot(run, projectId))
  )))
}

async function refreshObservabilityCatalog() {
  snapshots.value = await loadObservabilitySnapshots()
}

const metrics = computed(() => observabilityMetrics(snapshots.value ?? []))
const distributions = computed(() => observabilityDistributions(snapshots.value ?? []))
const logs = computed(() => observabilityLogs(snapshots.value ?? []))

function rangeDuration(value: string) {
  const day = 24 * 60 * 60 * 1000
  if (value === '1d') return day
  if (value === '30d') return 30 * day
  if (value === '90d') return 90 * day
  return 7 * day
}

function distributionMaximum(items: ObservabilityDistributionItem[]) {
  return Math.max(...items.map(item => item.value), 1)
}

function runLink(row: Record<string, unknown>) {
  return pipelineRunDetailRoute({
    projectId: String(row.projectId),
    pipelineId: String(row.pipelineId),
    runId: String(row.runId),
  })
}

definePageMeta({ layout: 'app' })
useHead({ title: 'Observability · Looping Louie' })
</script>

<template>
  <PageShell
    title="Observability"
    description="Inspect usage, latency, errors, and operational health from the execution ledger."
    class="observability-page"
  >
    <template #navigation>
      <div class="observability-controls">
        <UiSegmentedControl
          v-model="activeView"
          :options="viewOptions"
          variant="inline"
          accent="metal"
          bordered-options
          aria-label="Observability view"
        />
        <UiSegmentedControl
          v-model="dateRange"
          :options="rangeOptions"
          variant="inline"
          accent="metal"
          bordered-options
          aria-label="Observability date range"
        />
      </div>
    </template>

    <UiAsyncStage :status="status" loading-label="Loading execution ledger…" error-label="Observability could not be loaded." @retry="refresh">
      <div class="observability-content">
        <UiDataFreshnessNotice v-if="isStale" :description="staleMessage" :loading="isPollingRefreshing" @retry="retryPolling" />
        <div v-if="activeView === 'metrics'" class="observability-metrics">
          <div class="observability-grid">
            <UiMetricCard v-for="metric in metrics" :key="metric.label" v-bind="metric" class="observability-grid__metric" />
            <UiChartCard
              v-for="distribution in distributions"
              :key="distribution.title"
              :description="distribution.description"
              :title="distribution.title"
              :total="distribution.total"
              :total-label="distribution.totalLabel"
              class="observability-grid__chart"
            >
              <template #chart>
                <ol v-if="distribution.items.length" class="observability-bars">
                  <li v-for="item in distribution.items" :key="item.label">
                    <span class="observability-bars__label">{{ item.label }}</span>
                    <span class="observability-bars__track" aria-hidden="true"><i :style="{ width: `${(item.value / distributionMaximum(distribution.items)) * 100}%` }" /></span>
                    <strong>{{ item.value.toLocaleString() }}</strong>
                  </li>
                </ol>
                <p v-else class="observability-empty">No Harness turn data in this range.</p>
              </template>
              <template #legend><span>Harness turns in the selected range</span></template>
            </UiChartCard>
          </div>
        </div>
        <UiTable v-else :columns="logColumns" :rows="logs" caption="Harness turn events">
          <template #cell-run="{ row }"><NuxtLink class="observability-run-link" :to="runLink(row)">{{ row.run }}</NuxtLink></template>
          <template #empty>No Harness turns have been reported in this range.</template>
        </UiTable>
      </div>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.observability-controls { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-5); }
.observability-content { display: grid; min-width: 0; gap: var(--ll-space-6); }
.observability-metrics { min-width: 0; }
.observability-grid { display: grid; min-width: 0; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--ll-space-5); }
.observability-grid__metric { grid-column: span 3; }
.observability-grid__chart { grid-column: span 4; }
.observability-bars { display: grid; gap: var(--ll-space-4); padding: var(--ll-space-2) 0; margin: 0; list-style: none; }
.observability-bars li { display: grid; grid-template-columns: minmax(7rem, 0.9fr) minmax(8rem, 1.6fr) auto; align-items: center; gap: var(--ll-space-3); }
.observability-bars__label { min-width: 0; overflow: hidden; color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); text-overflow: ellipsis; white-space: nowrap; }
.observability-bars__track { height: 0.625rem; overflow: hidden; background: var(--ll-color-highlight); border-radius: var(--ll-radius-pill); }
.observability-bars__track i { display: block; height: 100%; background: var(--ll-color-primary); border-radius: inherit; }
.observability-bars strong { color: var(--ll-color-ink); font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono); }
.observability-empty { margin: 0; color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
.observability-run-link { color: var(--ll-color-ink); font-weight: 650; text-underline-offset: 0.15em; }
.observability-run-link:hover, .observability-run-link:focus-visible { color: var(--ll-color-primary); }
@media (max-width: 64rem) { .observability-grid__metric, .observability-grid__chart { grid-column: span 6; } }
@media (max-width: 44rem) { .observability-grid__metric, .observability-grid__chart { grid-column: 1 / -1; } .observability-controls { align-items: stretch; flex-direction: column; } .observability-bars li { grid-template-columns: minmax(6rem, 1fr) minmax(6rem, 1.25fr) auto; } }
</style>
