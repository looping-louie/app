<script setup lang="ts">
type MetricTrend = 'up' | 'down' | 'neutral'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  prefix?: string
  suffix?: string
  trend?: MetricTrend
  change?: string | number
  previousValue?: string | number
}>(), {
  prefix: undefined,
  suffix: undefined,
  trend: 'neutral',
  change: undefined,
  previousValue: undefined,
})

const trendIconPaths: Record<MetricTrend, string> = {
  up: 'M240,56v64a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32,0L96,123.31,37.66,181.66a8,8,0,0,1-11.32-11.32l64-64a8,8,0,0,1,11.32,0L136,140.69,212.69,64H168a8,8,0,0,1,0-16h64A8,8,0,0,1,240,56Z',
  down: 'M240,136v64a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h44.69L136,115.31l-34.34,34.35a8,8,0,0,1-11.32,0l-64-64A8,8,0,0,1,37.66,74.34L96,132.69l34.34-34.35a8,8,0,0,1,11.32,0L224,180.69V136a8,8,0,0,1,16,0Z',
  neutral: 'M200,72c-14.54,0-26.23,6.21-36.55,11.69C153.73,88.85,145.33,93.31,136,93.31c-7.72,0-16.08-3.5-25.76-7.56C99.09,81.08,86.46,75.79,72,75.79c-17.23,0-31.17,6.76-41.37,11.7A8,8,0,0,0,37.37,102C46.46,97.6,57.76,92,72,92c11.24,0,21.7,4.38,31.82,8.62,10.77,4.51,20.94,8.78,32.18,8.78,13.31,0,24-5.68,35-11.18C180.12,93.34,188.76,88,200,88c8.48,0,16.58,2.49,24.76,7.62a8,8,0,1,0,8.48-13.57C222.37,75.24,211.5,72,200,72Zm24.76,88.38C216.58,155.25,208.48,152,200,152c-11.24,0-19.88,5.34-29,10.18-11,5.5-21.69,11.18-35,11.18-11.24,0-21.41-4.27-32.18-8.78C93.7,160.34,83.24,156,72,156c-14.24,0-25.54,5.6-34.63,10a8,8,0,1,0-6.74,14.51C40.83,175.56,54.77,168,72,168c14.46,0,27.09,5.29,38.24,10,9.68,4.06,18,7.56,25.76,7.56,9.33,0,17.73-4.46,27.45-9.62C173.77,170.21,185.46,164,200,164c11.5,0,22.37,3.24,33.24,10.05a8,8,0,0,0,8.48-13.57Z',
}

const trendLabel = computed(() => ({
  up: 'Trend up',
  down: 'Trend down',
  neutral: 'Approximately unchanged',
})[props.trend])

const formattedChange = computed(() => {
  if (props.change === undefined) return ''
  const value = String(props.change)
  return value.trim().endsWith('%') ? value : `${value}%`
})
</script>

<template>
  <article class="ui-metric-card" :class="`ui-metric-card--${trend}`">
    <p class="ui-metric-card__eyebrow">{{ label }}</p>

    <p class="ui-metric-card__value">
      <span v-if="prefix" class="ui-metric-card__unit ui-metric-card__unit--prefix">{{ prefix }}</span>
      <span>{{ value }}</span>
      <span v-if="suffix" class="ui-metric-card__unit ui-metric-card__unit--suffix">{{ suffix }}</span>
    </p>

    <p v-if="change !== undefined" class="ui-metric-card__comparison">
      <span class="ui-metric-card__trend" :aria-label="`${trendLabel}: ${formattedChange}`">
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
          <path :d="trendIconPaths[trend]" />
        </svg>
        <span>{{ formattedChange }}</span>
      </span>
      <span v-if="previousValue !== undefined" class="ui-metric-card__previous-label">vs previous</span>
      <span v-if="previousValue !== undefined" class="ui-metric-card__previous-value">{{ previousValue }}</span>
    </p>
  </article>
</template>

<style scoped>
.ui-metric-card {
  display: flex;
  min-width: 0;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: flex-start;
  padding: var(--ll-space-6);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
}

.ui-metric-card__eyebrow,
.ui-metric-card__value,
.ui-metric-card__comparison {
  margin: 0;
}

.ui-metric-card__eyebrow {
  color: var(--ll-color-text-faint);
  font: 550 0.6875rem / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ui-metric-card__value {
  display: flex;
  min-width: 0;
  align-items: baseline;
  margin-block: var(--ll-space-3) var(--ll-space-2);
  font-family: var(--ll-font-display);
  font-size: clamp(1.75rem, 2.7vw, 2.5rem);
  font-weight: 650;
  line-height: 0.92;
  letter-spacing: -0.055em;
}

.ui-metric-card__unit {
  font: inherit;
  letter-spacing: inherit;
}

.ui-metric-card__unit--prefix {
  margin-right: 0.12em;
}

.ui-metric-card__unit--suffix {
  margin-left: 0.12em;
}

.ui-metric-card__comparison {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.28rem;
  color: var(--ll-color-text-faint);
  font-size: var(--ll-text-xs);
  line-height: 1.35;
}

.ui-metric-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 650;
}

.ui-metric-card__trend svg {
  width: 1rem;
  height: 1rem;
  flex: none;
  stroke: currentColor;
  stroke-width: 5;
  stroke-linejoin: round;
}

.ui-metric-card--up .ui-metric-card__trend {
  color: var(--ll-color-primary);
}

.ui-metric-card--down .ui-metric-card__trend {
  color: var(--ll-color-brand);
}

.ui-metric-card--neutral .ui-metric-card__trend {
  color: var(--ll-color-metal-700);
}

.ui-metric-card__previous-value {
  color: var(--ll-color-ink);
  font-weight: 620;
}
</style>
