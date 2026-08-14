<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiChartCard from '~/components/ui/ChartCard.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiMetricCard from '~/components/ui/MetricCard.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

const activeView = ref('metrics')

const viewOptions = [
  { value: 'metrics', label: 'Metrics' },
  { value: 'logs', label: 'Logs' },
]

const metrics = [
  { label: 'Completed runs', value: '1.24', suffix: 'K', trend: 'up' as const, change: '12.8', previousValue: '1.10K' },
  { label: 'Success rate', value: '94.2', suffix: '%', trend: 'neutral' as const, change: '0.3', previousValue: '93.9%' },
  { label: 'Average latency', value: '3.8', suffix: 's', trend: 'down' as const, change: '6.4', previousValue: '4.1s' },
  { label: 'Total cost', value: '128.4', prefix: '$', trend: 'up' as const, change: '9.7', previousValue: '$117.1' },
]

const charts = [
  {
    title: 'Token usage',
    description: 'Daily consumption across completed runs.',
    total: '534.0K',
    totalLabel: 'Total tokens',
    legend: 'Tokens',
    line: 'M0 146 C42 139 55 112 94 118 S151 80 191 91 S247 48 286 62 S337 29 380 38 S431 18 480 25',
  },
  {
    title: 'Model cost',
    description: 'Estimated spend across every provider.',
    total: '$128.4',
    totalLabel: 'Total cost',
    legend: 'Cost',
    line: 'M0 132 C36 126 62 139 96 108 S154 123 190 92 S245 104 286 72 S343 87 381 51 S436 68 480 39',
  },
  {
    title: 'Loop volume',
    description: 'Production runs completed each day.',
    total: '1.24K',
    totalLabel: 'Completed runs',
    legend: 'Runs',
    line: 'M0 151 C38 150 59 120 96 128 S149 95 190 109 S243 73 286 82 S340 55 381 66 S431 36 480 45',
  },
]

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Observability · Looping Louie',
})
</script>

<template>
  <PageShell
    title="Observability"
    description="Monitor performance, usage, and operational health across every production loop."
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

        <div class="observability-filters">
          <UiPill :focusable="false">
            <template #icon>
              <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                <path d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31l123.31-123.31A16,16,0,0,0,227.31,73.37ZM48,163.31l88-88L180.69,120l-88,88H48ZM216,84.69,192,108.69,147.31,64,171.31,40,216,84.69ZM128,216a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H136A8,8,0,0,1,128,216Z" />
              </svg>
            </template>
            Edit
          </UiPill>

          <UiPill :focusable="false">
            <template #icon>
              <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V88H208V208ZM48,72V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V72Z" />
              </svg>
            </template>
            This week
          </UiPill>
        </div>
      </div>
    </template>

    <div class="observability-metrics">
      <UiCollectionGroupTitle heading-as="h2" title="Metrics" />
      <UiSectionStage inverse="bottom" class="observability-stage">
        <div class="observability-grid">
          <UiMetricCard
            v-for="metric in metrics"
            :key="metric.label"
            v-bind="metric"
            class="observability-grid__metric"
          />

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
                  <defs>
                    <linearGradient :id="`observability-area-${index}`" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="var(--ll-color-primary-highlight)" stop-opacity="0.5" />
                      <stop offset="1" stop-color="var(--ll-color-primary-highlight)" stop-opacity="0.03" />
                    </linearGradient>
                  </defs>
                  <g class="observability-chart__grid" aria-hidden="true">
                    <path d="M0 20H480 M0 60H480 M0 100H480 M0 140H480 M0 180H480" />
                  </g>
                  <path :d="`${chart.line} V180 H0 Z`" :fill="`url(#observability-area-${index})`" />
                  <path :d="chart.line" class="observability-chart__line" />
                </svg>
                <div class="observability-chart__axis" aria-hidden="true">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </template>

            <template #legend>
              <span class="observability-chart__legend"><i />{{ chart.legend }}</span>
              <span>Production · daily</span>
            </template>
          </UiChartCard>
        </div>
      </UiSectionStage>
    </div>
  </PageShell>
</template>

<style scoped>
.observability-controls {
  display: grid;
  gap: var(--ll-space-5);
}

.observability-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
}

.observability-metrics {
  display: grid;
  min-width: 0;
  background: var(--ll-color-canvas);
}

.observability-stage :deep(.ui-section-stage__shell) {
  width: 100%;
}

.observability-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--ll-space-5);
}

.observability-grid__metric {
  grid-column: span 3;
}

.observability-grid__chart {
  grid-column: span 4;
}

.observability-chart {
  display: grid;
  height: 100%;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: var(--ll-space-2);
  padding-top: var(--ll-space-2);
}

.observability-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 12rem;
  overflow: visible;
}

.observability-chart__grid {
  fill: none;
  stroke: var(--ll-color-divider);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.observability-chart__line {
  fill: none;
  stroke: var(--ll-color-primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.observability-chart__axis {
  display: flex;
  justify-content: space-between;
  gap: var(--ll-space-2);
  color: var(--ll-color-text-faint);
  font: 500 var(--ll-text-xs) / 1 var(--ll-font-mono);
}

.observability-chart__legend {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-2);
}

.observability-chart__legend i {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ll-color-primary);
  border-radius: 50%;
}

@media (max-width: 64rem) {
  .observability-grid__metric,
  .observability-grid__chart {
    grid-column: span 6;
  }
}

@media (max-width: 44rem) {
  .observability-grid__metric,
  .observability-grid__chart {
    grid-column: 1 / -1;
  }

  .observability-controls :deep(.ui-segmented-control--inline) {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
