<script setup lang="ts">
const props = withDefaults(defineProps<{
  steps: string[]
  current: number
  savedLabel?: string
}>(), {
  savedLabel: undefined,
})

const progress = computed(() => {
  if (!props.steps.length) return 0
  return Math.min(100, Math.max(0, ((props.current + 1) / props.steps.length) * 100))
})
</script>

<template>
  <div class="ui-form-progress" role="group" aria-label="Form progress">
    <div class="ui-form-progress__track" aria-hidden="true">
      <span :style="{ width: `${progress}%` }" />
    </div>
    <div class="ui-form-progress__meta">
      <span>Step {{ current + 1 }} of {{ steps.length }} · {{ steps[current] }}</span>
      <span v-if="savedLabel" role="status">{{ savedLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.ui-form-progress { display: grid; width: 100%; gap: var(--ll-space-2); }
.ui-form-progress__track { height: 0.25rem; overflow: hidden; background: var(--ll-color-divider); border-radius: var(--ll-radius-pill); }
.ui-form-progress__track span { display: block; height: 100%; background: var(--ll-color-primary); border-radius: inherit; transition: width 240ms var(--ll-ease-out); }
.ui-form-progress__meta { display: flex; justify-content: space-between; gap: var(--ll-space-4); color: var(--ll-color-text-muted); font: 500 var(--ll-text-xs) / 1.3 var(--ll-font-control); }
@media (prefers-reduced-motion: reduce) { .ui-form-progress__track span { transition: none; } }
</style>
