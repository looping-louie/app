<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

interface SegmentOption {
  label: string
  value: string
  disabled?: boolean
}

type SegmentAccent = 'secondary' | 'primary' | 'gray'

const props = withDefaults(defineProps<{
  modelValue: string
  options: SegmentOption[]
  ariaLabel?: string
  fullWidth?: boolean
  accent?: SegmentAccent
}>(), {
  ariaLabel: 'Seleccionar una opción',
  fullWidth: false,
  accent: 'secondary',
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
    :class="[
      `ui-segmented-control--${accent}`,
      { 'ui-segmented-control--full': fullWidth },
    ]"
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
  --ui-segment-track-fill: #f7f6f3;
  --ui-segment-track-border-start: #ffffff;
  --ui-segment-track-border-end: #d2d1cb;

  position: relative;
  isolation: isolate;
  display: inline-grid;
  grid-template-columns: repeat(var(--ui-segment-count), minmax(6.75rem, 1fr));
  box-sizing: border-box;
  height: 2.125rem;
  max-width: 100%;
  padding: 0;
  background-image:
    linear-gradient(var(--ui-segment-track-fill), var(--ui-segment-track-fill)),
    linear-gradient(180deg, var(--ui-segment-track-border-start) 0%, var(--ui-segment-track-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  border: 1.5px solid transparent;
  border-radius: var(--ll-radius-pill);
  box-shadow: 0 4px 9px rgba(25, 26, 23, 0.1);
}

.ui-segmented-control--full {
  width: 100%;
}

.ui-segmented-control:has(.ui-segmented-control__option:hover:not(:disabled):not([data-selected="true"])) {
  --ui-segment-track-fill: #fcfbf8;
  --ui-segment-track-border-start: #ffffff;
  --ui-segment-track-border-end: #dad9d4;
}

.ui-segmented-control__indicator {
  --ui-segment-indicator-fill: #e7e6e2;
  --ui-segment-indicator-border-start: #ffffff;
  --ui-segment-indicator-border-end: #bebdb7;

  position: absolute;
  z-index: -1;
  inset-block: -0.09375rem;
  left: -0.09375rem;
  width: calc((100% + 0.1875rem) / var(--ui-segment-count));
  box-sizing: border-box;
  border: 1.5px solid transparent;
  border-radius: var(--ll-radius-pill);
  background-image:
    linear-gradient(var(--ui-segment-indicator-fill), var(--ui-segment-indicator-fill)),
    linear-gradient(180deg, var(--ui-segment-indicator-border-start) 0%, var(--ui-segment-indicator-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  box-shadow: 0 4px 9px rgba(25, 26, 23, 0.12);
  transform: translateX(calc(var(--ui-segment-index) * 100%));
  transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  pointer-events: none;
}

.ui-segmented-control--primary .ui-segmented-control__indicator {
  --ui-segment-indicator-fill: var(--ll-color-primary);
  --ui-segment-indicator-border-start: var(--ll-color-primary-highlight);
  --ui-segment-indicator-border-end: var(--ll-color-primary-depth);

  box-shadow: 0 4px 9px rgba(11, 45, 70, 0.28);
}

.ui-segmented-control--gray .ui-segmented-control__indicator {
  --ui-segment-indicator-fill: var(--ll-color-gray-950);
  --ui-segment-indicator-border-start: #ffffff;
  --ui-segment-indicator-border-end: #050607;

  box-shadow: 0 4px 9px rgba(17, 21, 24, 0.34);
}

.ui-segmented-control__option {
  position: relative;
  z-index: 1;
  min-width: 0;
  height: 100%;
  padding: 0 0.875rem;
  overflow: hidden;
  color: #333333;
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

.ui-segmented-control--primary .ui-segmented-control__option[data-selected="true"] {
  color: #f4f8fb;
}

.ui-segmented-control--gray .ui-segmented-control__option[data-selected="true"] {
  color: var(--ll-color-gray-050);
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
