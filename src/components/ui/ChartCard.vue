<script setup lang="ts">
type ChartHeadingAs = 'h2' | 'h3' | 'h4'

withDefaults(defineProps<{
  title: string
  description: string
  total: string | number
  totalLabel: string
  headingAs?: ChartHeadingAs
}>(), {
  headingAs: 'h3',
})
</script>

<template>
  <article class="ui-chart-card">
    <header class="ui-chart-card__header">
      <div class="ui-chart-card__copy">
        <component :is="headingAs" class="ui-chart-card__title">{{ title }}</component>
        <p class="ui-chart-card__description">{{ description }}</p>
      </div>

      <div class="ui-chart-card__total">
        <strong>{{ total }}</strong>
        <span>{{ totalLabel }}</span>
      </div>
    </header>

    <div v-if="$slots.controls" class="ui-chart-card__controls">
      <slot name="controls" />
    </div>

    <div class="ui-chart-card__visualization">
      <div class="ui-chart-card__chart">
        <slot name="chart" />
      </div>
      <div v-if="$slots.legend" class="ui-chart-card__legend">
        <slot name="legend" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.ui-chart-card {
  min-width: 0;
  box-sizing: border-box;
  padding: var(--ll-space-6);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
}

.ui-chart-card__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--ll-space-6);
}

.ui-chart-card__copy,
.ui-chart-card__total {
  display: grid;
  min-width: 0;
  gap: var(--ll-space-1);
}

.ui-chart-card__title,
.ui-chart-card__description {
  margin: 0;
}

.ui-chart-card__title {
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-size: var(--ll-text-lg);
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.ui-chart-card__description,
.ui-chart-card__total span {
  color: var(--ll-color-text-faint);
  font-size: var(--ll-text-xs);
  line-height: 1.35;
}

.ui-chart-card__total {
  justify-items: end;
  text-align: right;
}

.ui-chart-card__total strong {
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-size: var(--ll-text-lg);
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.ui-chart-card__controls {
  display: flex;
  min-width: 0;
  margin-top: var(--ll-space-5);
  overflow-x: auto;
}

.ui-chart-card__visualization {
  min-width: 0;
  margin-top: var(--ll-space-5);
}

.ui-chart-card__chart {
  min-width: 0;
  min-height: 15rem;
}

.ui-chart-card__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-4);
  padding-top: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  border-top: 1px solid var(--ll-color-divider);
  font-size: var(--ll-text-xs);
}

@media (max-width: 44rem) {
  .ui-chart-card {
    padding: var(--ll-space-5);
  }

  .ui-chart-card__header {
    grid-template-columns: 1fr;
    gap: var(--ll-space-4);
  }

  .ui-chart-card__total {
    justify-items: start;
    text-align: left;
  }

  .ui-chart-card__chart {
    min-height: 12rem;
  }
}
</style>
