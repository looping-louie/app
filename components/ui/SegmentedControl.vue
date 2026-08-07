<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

interface SegmentOption {
  label: string
  value: string
  disabled?: boolean
}

type SegmentAccent = 'secondary' | 'primary' | 'metal'
type SegmentVariant = 'contained' | 'inline'

const props = withDefaults(defineProps<{
  modelValue: string
  options: SegmentOption[]
  ariaLabel?: string
  accent?: SegmentAccent
  variant?: SegmentVariant
  borderedOptions?: boolean
}>(), {
  ariaLabel: 'Select an option',
  accent: 'secondary',
  variant: 'contained',
  borderedOptions: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const optionRefs = ref<Array<HTMLButtonElement | undefined>>([])
const inlineIndicator = ref({ x: 0, width: 0 })
const inlineIndicatorReady = ref(false)
let resizeObserver: ResizeObserver | undefined
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const segmentStyle = computed(() => ({
  '--ui-segment-count': String(Math.max(props.options.length, 1)),
  '--ui-segment-index': String(Math.max(selectedIndex.value, 0)),
  '--ui-segment-indicator-x': `${inlineIndicator.value.x}px`,
  '--ui-segment-indicator-width': `${inlineIndicator.value.width}px`,
}))

function setOptionRef(element: Element | ComponentPublicInstance | null, index: number) {
  if (element instanceof HTMLButtonElement) {
    optionRefs.value[index] = element
  } else {
    optionRefs.value[index] = undefined
  }
}

function measureInlineIndicator() {
  if (props.variant !== 'inline') return

  const selectedOption = optionRefs.value[selectedIndex.value]
  if (!selectedOption) return

  inlineIndicator.value = {
    x: selectedOption.offsetLeft,
    width: selectedOption.offsetWidth,
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

watch(
  () => [
    props.modelValue,
    props.variant,
    props.options.map(option => `${option.value}:${option.label}:${option.disabled}`).join('|'),
  ],
  async () => {
    await nextTick()
    measureInlineIndicator()
  },
)

onMounted(async () => {
  await nextTick()
  measureInlineIndicator()

  resizeObserver = new ResizeObserver(measureInlineIndicator)
  if (rootRef.value) resizeObserver.observe(rootRef.value)

  requestAnimationFrame(() => {
    inlineIndicatorReady.value = true
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="rootRef"
    class="ui-segmented-control"
    :class="[
      `ui-segmented-control--${accent}`,
      `ui-segmented-control--${variant}`,
      {
        'ui-segmented-control--indicator-ready': inlineIndicatorReady,
        'ui-segmented-control--bordered-options': borderedOptions,
      },
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

.ui-segmented-control--contained:has(.ui-segmented-control__option:hover:not(:disabled):not([data-selected="true"])) {
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

.ui-segmented-control--inline {
  display: inline-flex;
  width: fit-content;
  height: 2.25rem;
  max-width: 100%;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.ui-segmented-control--inline.ui-segmented-control--bordered-options {
  gap: var(--ll-space-3);
}

.ui-segmented-control--inline .ui-segmented-control__indicator {
  z-index: 0;
  inset-block: 0;
  left: 0;
  width: var(--ui-segment-indicator-width);
  transform: translateX(var(--ui-segment-indicator-x));
  transition: none;
  will-change: width, transform;
}

.ui-segmented-control--inline.ui-segmented-control--indicator-ready .ui-segmented-control__indicator {
  transition:
    width 240ms cubic-bezier(0.32, 0.72, 0, 1),
    transform 240ms cubic-bezier(0.32, 0.72, 0, 1);
}

.ui-segmented-control--primary .ui-segmented-control__indicator {
  --ui-segment-indicator-fill: var(--ll-color-primary);
  --ui-segment-indicator-border-start: var(--ll-color-primary-highlight);
  --ui-segment-indicator-border-end: var(--ll-color-primary-depth);

  box-shadow: 0 4px 9px rgba(11, 45, 70, 0.28);
}

.ui-segmented-control--metal .ui-segmented-control__indicator {
  --ui-segment-indicator-fill: var(--ll-color-metal-950);
  --ui-segment-indicator-border-start: #ffffff;
  --ui-segment-indicator-border-end: #050607;

  box-shadow: 0 4px 9px rgba(17, 21, 24, 0.34);
}

.ui-segmented-control__option {
  position: relative;
  z-index: 1;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
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

.ui-segmented-control--inline .ui-segmented-control__option {
  flex: 0 0 auto;
  min-height: 2.25rem;
  padding-inline: 0.875rem;
  overflow: visible;
  color: var(--ll-color-metal-700);
  font-size: 0.8125rem;
  font-weight: 470;
  letter-spacing: 0.0121875rem;
  text-overflow: clip;
}

.ui-segmented-control--inline.ui-segmented-control--bordered-options .ui-segmented-control__option {
  border: 1px solid var(--ll-color-divider);
}

.ui-segmented-control--inline.ui-segmented-control--bordered-options .ui-segmented-control__option[data-selected="true"] {
  border-color: transparent;
}

.ui-segmented-control--inline.ui-segmented-control--bordered-options .ui-segmented-control__option:hover:not(:disabled):not([data-selected="true"]) {
  border-color: var(--ll-color-border-strong);
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

.ui-segmented-control--metal .ui-segmented-control__option[data-selected="true"] {
  color: var(--ll-color-metal-100);
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
  .ui-segmented-control--contained {
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
