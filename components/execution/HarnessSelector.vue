<script setup lang="ts">
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import type { ExecutionHarness } from '~/types/api'

const props = withDefaults(defineProps<{
  modelValue: ExecutionHarness | null
  inheritLabel?: string
  inheritDescription?: string
  disabled?: boolean
}>(), {
  inheritLabel: 'Inherit',
  inheritDescription: 'The next execution scope supplies the harness; if none does, the API uses Louie v1.',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: ExecutionHarness | null]
}>()

const options = computed(() => [
  { value: 'inherit', label: props.inheritLabel },
  { value: 'louie', label: 'Louie' },
  { value: 'codex_cli', label: 'Codex CLI' },
])
const selected = computed({
  get: () => props.modelValue?.kind ?? 'inherit',
  set: (value: string) => {
    if (props.disabled) return
    emit('update:modelValue', value === 'inherit'
      ? null
      : { kind: value as ExecutionHarness['kind'], version: 'v1', config: {} })
  },
})
</script>

<template>
  <div class="execution-harness-selector">
    <UiSegmentedControl v-model="selected" :options="options" :disabled="disabled" aria-label="Execution harness" />
    <p v-if="modelValue?.kind === 'codex_cli'">Runs require a worker advertising the Codex CLI v1 harness.</p>
    <p v-else-if="modelValue?.kind === 'louie'">Runs require a worker advertising the Louie v1 harness.</p>
    <p v-else>{{ inheritDescription }}</p>
  </div>
</template>

<style scoped>
.execution-harness-selector { display: grid; gap: var(--ll-space-3); }
.execution-harness-selector :deep(.ui-segmented-control) { width: fit-content; max-width: 100%; }
.execution-harness-selector p { margin: 0; color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
</style>
