<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

interface SegmentOption {
  label: string
  value: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: SegmentOption[]
  ariaLabel?: string
  fullWidth?: boolean
}>(), {
  ariaLabel: 'Seleccionar una opción',
  fullWidth: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const optionRefs = ref<HTMLButtonElement[]>([])
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const segmentStyle = computed(() => ({
  '--ui-segment-count': String(Math.max(props.options.length, 1)),
  '--ui-segment-index': String(Math.max(selectedIndex.value, 0)),
}))

function setOptionRef(element: Element | ComponentPublicInstance | null, index: number) {
  if (element instanceof HTMLButtonElement) {
    optionRefs.value[index] = element
  }
}

function selectOption(index: number) {
  const option = props.options[index]
  if (!option || option.disabled) return
  emit('update:modelValue', option.value)
}

function findEnabledIndex(startIndex: number, direction: 1 | -1) {
  const optionCount = props.options.length
  if (!optionCount) return -1

  for (let offset = 1; offset <= optionCount; offset += 1) {
    const candidate = (startIndex + direction * offset + optionCount) % optionCount
    if (!props.options[candidate]?.disabled) return candidate
  }

  return -1
}

async function focusAndSelect(index: number) {
  if (index < 0) return
  selectOption(index)
  await nextTick()
  optionRefs.value[index]?.focus()
}

function handleKeydown(event: KeyboardEvent, index: number) {
  let nextIndex = -1

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = findEnabledIndex(index, 1)
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = findEnabledIndex(index, -1)
  } else if (event.key === 'Home') {
    nextIndex = props.options.findIndex(option => !option.disabled)
  } else if (event.key === 'End') {
    nextIndex = props.options.findLastIndex(option => !option.disabled)
  } else {
    return
  }

  event.preventDefault()
  focusAndSelect(nextIndex)
}
</script>

<template>
  <div
    class="ui-segmented-control"
    :class="{ 'ui-segmented-control--full': fullWidth }"
    :style="segmentStyle"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <span
      v-if="selectedIndex >= 0"
      class="ui-segmented-control__indicator"
      aria-hidden="true"
    />

    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="element => setOptionRef(element, index)"
      type="button"
      class="ui-segmented-control__option"
      role="radio"
      :data-selected="option.value === modelValue"
      :aria-checked="option.value === modelValue"
      :disabled="option.disabled"
      :tabindex="option.value === modelValue ? 0 : -1"
      @click="selectOption(index)"
      @keydown="handleKeydown($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented-control {
  position: relative;
  isolation: isolate;
  display: inline-grid;
  grid-template-columns: repeat(var(--ui-segment-count), minmax(6.75rem, 1fr));
  height: 2.5rem;
  max-width: 100%;
  padding: 0.125rem;
  background: var(--ll-control-surface);
  border: 0;
  border-radius: var(--ll-radius-pill);
  box-shadow:
    0 7px 18px rgba(25, 26, 23, 0.1),
    0 1px 3px rgba(25, 26, 23, 0.07);
}

.ui-segmented-control--full {
  width: 100%;
}

.ui-segmented-control__indicator {
  position: absolute;
  z-index: -1;
  inset-block: 0.125rem;
  left: 0.125rem;
  width: calc((100% - 0.25rem) / var(--ui-segment-count));
  border: 0;
  border-radius: var(--ll-radius-pill);
  background: var(--ll-control-surface-selected);
  box-shadow:
    0 2px 5px rgba(25, 26, 23, 0.09),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transform: translateX(calc(var(--ui-segment-index) * 100%));
  transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  pointer-events: none;
}

.ui-segmented-control__option {
  position: relative;
  z-index: 1;
  min-width: 0;
  height: 100%;
  padding: 0 0.875rem;
  overflow: hidden;
  color: var(--ll-color-text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--ll-radius-pill);
  font: 500 0.875rem / 1 var(--ll-font-control);
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

.ui-segmented-control__option:hover:not(:disabled):not([data-selected="true"]) {
  color: var(--ll-color-ink);
}

.ui-segmented-control__option[data-selected="true"] {
  color: var(--ll-color-ink);
}

.ui-segmented-control__option:focus-visible {
  outline: 2px solid var(--ll-color-signal-ink);
  outline-offset: -4px;
}

.ui-segmented-control__option:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

@media (max-width: 30rem) {
  .ui-segmented-control {
    width: 100%;
    grid-auto-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-segmented-control__indicator,
  .ui-segmented-control__option {
    transition: none;
  }
}
</style>
