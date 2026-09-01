<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiChartCard from '~/components/ui/ChartCard.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiMetricCard from '~/components/ui/MetricCard.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import UiTable from '~/components/ui/Table.vue'
import { collectApiPages } from '~/utils/apiPagination'
import { observabilityCharts, observabilityLogs, observabilityMetrics } from '~/utils/observability'
import type { PipelineRunSnapshot } from '~/utils/pipelineRuns'

const activeView = ref('metrics')
const api = useApiClient()

const viewOptions = [
  { value: 'metrics', label: 'Metrics' },
  { value: 'logs', label: 'Logs' },
]
const logColumns = [
  { key: 'created', label: 'Time' },
  { key: 'type', label: 'Event' },
  { key: 'run', label: 'Run', width: '24%' },
  { key: 'activity', label: 'Activity' },
  { key: 'activityRun', label: 'Activity run' },
  { key: 'error', label: 'Error', width: '25%' },
]

const { data: snapshots, status, refresh } = await useAsyncData('observability-runs', async () => {
  const createdFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const runs = await collectApiPages(offset => api.pipelineRuns.list({
    offset,
    created_from: createdFrom,
  }))
  return Promise.all(runs.map(loadSnapshot))
})
usePipelineRunPolling(
  () => snapshots.value?.map(snapshot => snapshot.run) ?? [],
  async (updates) => {
    const refreshed = await Promise.all(updates.map(loadSnapshot))
    const byId = new Map(refreshed.map(snapshot => [snapshot.run.id, snapshot]))
    snapshots.value = (snapshots.value ?? []).map(snapshot => byId.get(snapshot.run.id) ?? snapshot)
  },
)

async function loadSnapshot(run: PipelineRunSnapshot['run']): Promise<PipelineRunSnapshot> {
  const events = await api.pipelines.listRunEvents(run.pipeline_id, run.id)
  return { run, events: events.items }
}

const metrics = computed(() => observabilityMetrics(snapshots.value ?? []))
const charts = computed(() => observabilityCharts(snapshots.value ?? []))
const logs = computed(() => observabilityLogs(snapshots.value ?? []))

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
        <UiPill :focusable="false">
          <template #icon>
            <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
              <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V88H208V208ZM48,72V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V72Z" />
            </svg>
          </template>
          Last 7 days
        </UiPill>
      </div>
    </template>

    <UiAsyncStage :status="status" loading-label="Loading execution ledger…" error-label="Observability could not be loaded." @retry="refresh">
      <div v-if="activeView === 'metrics'" class="observability-metrics">
        <UiCollectionGroupTitle heading-as="h2" title="Metrics" />
        <UiSectionStage inverse="bottom" class="observability-stage">
          <div class="observability-grid">
            <UiMetricCard v-for="metric in metrics" :key="metric.label" v-bind="metric" class="observability-grid__metric" />
            <UiChartCard
              v-for="(chart, index) in charts"
              :key="chart.title"
              :title="chart.title"
              :description="chart.description"
              :total="chart.total"
              :total-label="chart.totalLabel"
              class="observability-grid__chart"
            >
              <template #chart>
                <div class="observability-chart">
                  <svg viewBox="0 0 480 180" preserveAspectRatio="none" role="img" :aria-label="`${chart.title} over time`">
                    <defs><linearGradient :id="`observability-area-${index}`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--ll-color-primary-highlight)" stop-opacity="0.5" /><stop offset="1" stop-color="var(--ll-color-primary-highlight)" stop-opacity="0.03" /></linearGradient></defs>
                    <g class="observability-chart__grid" aria-hidden="true"><path d="M0 20H480 M0 60H480 M0 100H480 M0 140H480 M0 180H480" /></g>
                    <path :d="`${chart.line} V180 H0 Z`" :fill="`url(#observability-area-${index})`" />
                    <path :d="chart.line" class="observability-chart__line" />
                  </svg>
                  <div class="observability-chart__axis" aria-hidden="true"><span>-6d</span><span>-5d</span><span>-4d</span><span>-3d</span><span>-2d</span><span>Yesterday</span><span>Today</span></div>
                </div>
              </template>
              <template #legend><span class="observability-chart__legend"><i />{{ chart.legend }}</span><span>Execution ledger · daily</span></template>
            </UiChartCard>
          </div>
        </UiSectionStage>
      </div>
      <UiTable v-else :columns="logColumns" :rows="logs" caption="Execution ledger events">
        <template #empty>No execution events have been reported yet.</template>
      </UiTable>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.observability-controls { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-5); }
.observability-metrics { display: grid; min-width: 0; background: var(--ll-color-canvas); }
.observability-stage :deep(.ui-section-stage__shell) { width: 100%; }
.observability-grid { display: grid; min-width: 0; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--ll-space-5); }
.observability-grid__metric { grid-column: span 3; }
.observability-grid__chart { grid-column: span 4; }
.observability-chart { display: grid; height: 100%; grid-template-rows: minmax(0, 1fr) auto; gap: var(--ll-space-2); padding-top: var(--ll-space-2); }
.observability-chart svg { display: block; width: 100%; height: 100%; min-height: 12rem; overflow: visible; }
.observability-chart__grid { fill: none; stroke: var(--ll-color-divider); stroke-width: 1; vector-effect: non-scaling-stroke; }
.observability-chart__line { fill: none; stroke: var(--ll-color-primary); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.observability-chart__axis { display: flex; justify-content: space-between; gap: var(--ll-space-2); color: var(--ll-color-text-faint); font: 500 var(--ll-text-xs) / 1 var(--ll-font-mono); }
.observability-chart__legend { display: inline-flex; align-items: center; gap: var(--ll-space-2); }
.observability-chart__legend i { width: 0.5rem; height: 0.5rem; background: var(--ll-color-primary); border-radius: 50%; }
@media (max-width: 64rem) { .observability-grid__metric, .observability-grid__chart { grid-column: span 6; } }
@media (max-width: 44rem) { .observability-grid__metric, .observability-grid__chart { grid-column: 1 / -1; } .observability-controls { align-items: stretch; flex-direction: column; } }
</style>
