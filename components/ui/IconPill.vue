<script setup lang="ts">
export interface IconPillOption {
  value: string
  label: string
  disabled?: boolean
}

type DropdownAlign = 'left' | 'right'
type SelectionType = 'radio' | 'checkbox'

const props = withDefaults(defineProps<{
  clickable?: boolean
  ariaLabel?: string
  dropdownLabel?: string
  dropdownAlign?: DropdownAlign
  selectionType?: SelectionType
  options?: IconPillOption[]
  modelValue?: string | string[]
}>(), {
  clickable: false,
  ariaLabel: undefined,
  dropdownLabel: 'Options',
  dropdownAlign: 'left',
  selectionType: 'radio',
  options: () => [],
  modelValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const closing = ref(false)
const confirmingValue = ref<string | null>(null)
const restoreFocusAfterClose = ref(false)
let confirmationTimer: ReturnType<typeof setTimeout> | undefined
const dropdownId = `ui-icon-pill-${useId().replaceAll(':', '')}`
const connected = computed(() => open.value || closing.value)

function toggleDropdown() {
  if (!props.clickable) return
  if (open.value) {
    closeDropdown()
    return
  }

  closing.value = false
  open.value = true
}

function closeDropdown({ restoreFocus = false } = {}) {
  if (!open.value) return

  if (confirmationTimer) {
    clearTimeout(confirmationTimer)
    confirmationTimer = undefined
  }
  confirmingValue.value = null
  restoreFocusAfterClose.value = restoreFocus
  closing.value = true
  open.value = false
}

function onDropdownAfterLeave() {
  closing.value = false
  if (restoreFocusAfterClose.value) trigger.value?.focus()
  restoreFocusAfterClose.value = false
}

function isSelected(value: string) {
  if (props.selectionType === 'checkbox') {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value)
  }

  return props.modelValue === value
}

function selectOption(option: IconPillOption) {
  if (option.disabled || confirmingValue.value) return

  if (props.selectionType === 'checkbox') {
    const selected = Array.isArray(props.modelValue) ? props.modelValue : []
    emit(
      'update:modelValue',
      selected.includes(option.value)
        ? selected.filter(value => value !== option.value)
        : [...selected, option.value],
    )
    return
  }

  emit('update:modelValue', option.value)
  confirmingValue.value = option.value
  confirmationTimer = setTimeout(() => {
    confirmationTimer = undefined
    confirmingValue.value = null
    closeDropdown({ restoreFocus: true })
  }, 520)
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) closeDropdown()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) closeDropdown({ restoreFocus: true })
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  if (confirmationTimer) clearTimeout(confirmationTimer)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div
    ref="root"
    class="ui-icon-pill"
    :class="[
      `ui-icon-pill--align-${dropdownAlign}`,
      {
        'ui-icon-pill--clickable': clickable,
        'ui-icon-pill--open': connected,
        'ui-icon-pill--closing': closing,
      },
    ]"
  >
    <button
      v-if="clickable"
      ref="trigger"
      type="button"
      class="ui-icon-pill__trigger"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      :aria-controls="dropdownId"
      @click="toggleDropdown"
    >
      <span class="ui-icon-pill__icon" aria-hidden="true"><slot name="icon" /></span>
      <span class="ui-icon-pill__label"><slot /></span>
    </button>

    <span v-else class="ui-icon-pill__trigger" :aria-label="ariaLabel">
      <span class="ui-icon-pill__icon" aria-hidden="true"><slot name="icon" /></span>
      <span class="ui-icon-pill__label"><slot /></span>
    </span>

    <svg
      v-if="connected"
      class="ui-icon-pill__shoulder"
      viewBox="0 0 16 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path class="ui-icon-pill__shoulder-fill" d="M0 0 Q0 16 16 16 H0 Z" />
      <path class="ui-icon-pill__shoulder-stroke" d="M0 0 Q0 16 16 16" vector-effect="non-scaling-stroke" />
    </svg>

    <Transition name="ui-icon-pill-dropdown" @after-leave="onDropdownAfterLeave">
      <div
        v-if="open"
        :id="dropdownId"
        class="ui-icon-pill__dropdown"
        :role="options.length && selectionType === 'radio' ? 'radiogroup' : 'group'"
        :aria-label="dropdownLabel"
      >
        <div v-if="options.length" class="ui-icon-pill__options">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="ui-icon-pill__option"
            :class="{
              'is-selected': isSelected(option.value),
              'is-confirming': confirmingValue === option.value,
            }"
            :role="selectionType === 'radio' ? 'radio' : 'checkbox'"
            :aria-checked="isSelected(option.value)"
            :disabled="option.disabled"
            @click="selectOption(option)"
          >
            <span class="ui-icon-pill__selection-icon" aria-hidden="true">
              <svg v-if="selectionType === 'radio'" viewBox="0 0 256 256" fill="currentColor">
                <path v-if="isSelected(option.value)" d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                <path v-else d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
              </svg>
              <svg v-else viewBox="0 0 256 256" fill="currentColor">
                <path v-if="isSelected(option.value)" d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-34.34-109.66a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
                <path v-else d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Z" />
              </svg>
            </span>
            <span>{{ option.label }}</span>
          </button>
        </div>
        <slot v-else name="dropdown" :close="closeDropdown" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ui-icon-pill {
  --ui-icon-pill-height: 2rem;
  --ui-icon-pill-radius: calc(var(--ui-icon-pill-height) / 2);
  --ui-icon-pill-surface: var(--ll-color-card);
  --ui-icon-pill-surface-hover: var(--ll-color-highlight);
  --ui-icon-pill-border: var(--ll-color-divider);
  --ui-icon-pill-shoulder: 1rem;
  --ui-icon-pill-dropdown-radius: var(--ll-radius-lg);

  position: relative;
  z-index: 0;
  display: inline-block;
  height: var(--ui-icon-pill-height);
  color: var(--ll-color-ink);
  font-family: var(--ll-font-control);
  vertical-align: middle;
}

.ui-icon-pill--open { z-index: 10; }

.ui-icon-pill__trigger {
  position: relative;
  z-index: 3;
  display: inline-flex;
  height: var(--ui-icon-pill-height);
  box-sizing: border-box;
  align-items: center;
  gap: 0.4375rem;
  padding: 0 0.75rem;
  color: inherit;
  background: var(--ui-icon-pill-surface);
  border: 1px solid var(--ui-icon-pill-border);
  border-radius: var(--ui-icon-pill-radius);
  font: 500 var(--ll-text-sm) / 1 var(--ll-font-control);
  letter-spacing: 0;
  white-space: nowrap;
}

button.ui-icon-pill__trigger {
  appearance: none;
  cursor: pointer;
  transition: color var(--ll-duration-normal) var(--ll-ease-out), background-color var(--ll-duration-normal) var(--ll-ease-out);
}

button.ui-icon-pill__trigger:hover,
.ui-icon-pill--open .ui-icon-pill__trigger { background: var(--ui-icon-pill-surface-hover); }

button.ui-icon-pill__trigger:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.ui-icon-pill--open .ui-icon-pill__trigger {
  --ui-icon-pill-surface: var(--ui-icon-pill-surface-hover);
  border-top-left-radius: var(--ui-icon-pill-radius);
  border-top-right-radius: var(--ui-icon-pill-radius);
  border-bottom-color: transparent;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.ui-icon-pill__icon {
  display: grid;
  width: 1rem;
  height: 1rem;
  flex: none;
  place-items: center;
  color: var(--ll-color-text-muted);
}

.ui-icon-pill__icon :deep(svg) { display: block; width: 100%; height: 100%; }

.ui-icon-pill__shoulder {
  position: absolute;
  z-index: 4;
  top: calc(100% - var(--ui-icon-pill-shoulder) - 1px);
  left: calc(100% - 1px);
  width: var(--ui-icon-pill-shoulder);
  height: var(--ui-icon-pill-shoulder);
  overflow: visible;
  pointer-events: none;
}

.ui-icon-pill--align-right .ui-icon-pill__shoulder {
  right: calc(100% - 1px);
  left: auto;
  transform: scaleX(-1);
}

.ui-icon-pill__shoulder-fill { fill: var(--ui-icon-pill-surface-hover); }
.ui-icon-pill__shoulder-stroke { fill: none; stroke: var(--ui-icon-pill-border); stroke-width: 1px; }

.ui-icon-pill--open::after {
  position: absolute;
  z-index: 2;
  top: calc(100% - 1px);
  left: 1px;
  width: calc(100% + var(--ui-icon-pill-shoulder) - 2px);
  height: 2px;
  background: var(--ui-icon-pill-surface-hover);
  pointer-events: none;
  content: '';
}

.ui-icon-pill--open.ui-icon-pill--align-right::after { right: 1px; left: auto; }

.ui-icon-pill__dropdown {
  position: absolute;
  z-index: 1;
  top: calc(100% - 1px);
  left: 0;
  width: max(18rem, 100%);
  max-width: calc(100vw - 2rem);
  box-sizing: border-box;
  padding: var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ui-icon-pill-surface-hover);
  border: 1px solid var(--ui-icon-pill-border);
  border-radius: 0 var(--ui-icon-pill-dropdown-radius) var(--ui-icon-pill-dropdown-radius);
  box-shadow: var(--ll-shadow-raised);
  transform-origin: top left;
}

.ui-icon-pill--align-right .ui-icon-pill__dropdown {
  right: 0;
  left: auto;
  border-radius: var(--ui-icon-pill-dropdown-radius) 0 var(--ui-icon-pill-dropdown-radius) var(--ui-icon-pill-dropdown-radius);
  transform-origin: top right;
}

.ui-icon-pill__options { display: grid; gap: var(--ll-space-1); }

.ui-icon-pill__option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3);
  color: var(--ll-color-ink);
  background: transparent;
  border: 0;
  border-radius: var(--ll-radius-md);
  font: 500 var(--ll-text-sm) / 1.2 var(--ll-font-control);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-icon-pill__option:hover:not(:disabled),
.ui-icon-pill__option:focus-visible { background: var(--ll-color-card); }
.ui-icon-pill__option.is-confirming {
  animation: ui-icon-pill-radio-confirm 520ms ease-in-out both;
  pointer-events: none;
}
.ui-icon-pill__option:focus-visible { outline: 2px solid var(--ll-color-primary); outline-offset: -2px; }
.ui-icon-pill__option:disabled { cursor: not-allowed; opacity: 0.48; }

.ui-icon-pill__selection-icon {
  display: block;
  width: 1rem;
  height: 1rem;
  flex: none;
  color: var(--ll-color-text-muted);
}

.ui-icon-pill__selection-icon svg { display: block; width: 100%; height: 100%; }
.ui-icon-pill__option.is-selected .ui-icon-pill__selection-icon { color: var(--ll-color-primary); }

.ui-icon-pill-dropdown-enter-active,
.ui-icon-pill-dropdown-leave-active {
  transition: opacity 180ms cubic-bezier(0.55, 0, 1, 0.45), transform 220ms cubic-bezier(0.55, 0, 1, 0.45);
}

.ui-icon-pill-dropdown-enter-from,
.ui-icon-pill-dropdown-leave-to { opacity: 0; transform: scaleY(0.96); }

@keyframes ui-icon-pill-radio-confirm {
  0%, 42%, 84%, 100% { background: var(--ll-color-card); }
  21%, 63% { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-icon-pill-dropdown-enter-active,
  .ui-icon-pill-dropdown-leave-active { transition: none; }

  .ui-icon-pill__option.is-confirming { animation: none; }
}
</style>
