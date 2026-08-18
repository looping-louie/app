<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiToggle from '~/components/ui/Toggle.vue'

export interface PillOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
}

type DropdownAlign = 'left' | 'right'
type SelectionType = 'radio' | 'checkbox'
type IconStyle = 'plain' | 'circle'
type AriaHasPopup = 'dialog' | 'grid' | 'listbox' | 'menu' | 'tree'
type PillVariant = 'compact' | 'catalog'
type PillActionVisibility = 'always' | 'hover'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  iconStyle?: IconStyle
  clickable?: boolean
  focusable?: boolean
  ariaLabel?: string
  tooltip?: string
  ariaHaspopup?: AriaHasPopup
  dropdownLabel?: string
  dropdownAlign?: DropdownAlign
  selectionType?: SelectionType
  options?: PillOption[]
  modelValue?: string | string[]
  variant?: PillVariant
  description?: string
  toggle?: boolean
  toggleValue?: boolean
  toggleLabel?: string
  toggleDisabled?: boolean
  actionIconPath?: string
  actionLabel?: string
  actionHref?: string
  actionTarget?: string
  actionRel?: string
  actionVisibility?: PillActionVisibility
}>(), {
  src: undefined,
  alt: '',
  iconStyle: 'plain',
  clickable: false,
  focusable: true,
  ariaLabel: undefined,
  tooltip: undefined,
  ariaHaspopup: undefined,
  dropdownLabel: 'Options',
  dropdownAlign: 'left',
  selectionType: 'radio',
  options: () => [],
  modelValue: undefined,
  variant: 'compact',
  description: undefined,
  toggle: false,
  toggleValue: false,
  toggleLabel: 'Toggle item',
  toggleDisabled: false,
  actionIconPath: undefined,
  actionLabel: 'Open action',
  actionHref: undefined,
  actionTarget: undefined,
  actionRel: undefined,
  actionVisibility: 'always',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'update:toggleValue': [value: boolean]
  click: [event: MouseEvent]
  action: [event: MouseEvent]
}>()

const slots = useSlots()
const hasIcon = computed(() => Boolean(slots.icon))
const hasLabel = computed(() => Boolean(slots.default))
const hasMedia = computed(() => Boolean(props.src || hasIcon.value))
const hasDropdown = computed(() => Boolean(props.options.length || slots.dropdown))
const circularMedia = computed(() => Boolean(props.src || (hasIcon.value && props.iconStyle === 'circle')))
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const closing = ref(false)
const confirmingValue = ref<string | null>(null)
const restoreFocusAfterClose = ref(false)
let confirmationTimer: ReturnType<typeof setTimeout> | undefined
const dropdownId = `ui-pill-${useId().replaceAll(':', '')}`
const tooltipId = `ui-pill-tooltip-${useId().replaceAll(':', '')}`
const connected = computed(() => open.value || closing.value)

function toggleDropdown() {
  if (!props.clickable || !hasDropdown.value) return
  if (open.value) {
    closeDropdown()
    return
  }

  closing.value = false
  open.value = true
}

function activate(event: MouseEvent) {
  if (hasDropdown.value) {
    toggleDropdown()
    return
  }

  emit('click', event)
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

function selectOption(option: PillOption) {
  if (option.disabled || confirmingValue.value !== null) return

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
      `ui-icon-pill--${variant}`,
      {
        'ui-icon-pill--text-only': !hasMedia,
        'ui-icon-pill--icon-only': hasMedia && !hasLabel,
        'ui-icon-pill--circular-media': circularMedia,
        'ui-icon-pill--image': Boolean(src),
        'ui-icon-pill--has-tooltip': Boolean(tooltip),
        'ui-icon-pill--clickable': clickable,
        'ui-icon-pill--open': connected,
        'ui-icon-pill--closing': closing,
      },
    ]"
  >
    <template v-if="variant === 'catalog'">
      <span class="ui-icon-pill__catalog-content">
        <span v-if="src" class="ui-icon-pill__media ui-icon-pill__media--image">
          <img :src="src" :alt="alt" width="44" height="44" loading="lazy">
        </span>
        <span
          v-else-if="$slots.icon"
          :class="iconStyle === 'circle' ? 'ui-icon-pill__media ui-icon-pill__media--icon' : 'ui-icon-pill__icon'"
          aria-hidden="true"
        >
          <slot name="icon" />
        </span>
        <span class="ui-icon-pill__catalog-copy">
          <strong v-if="hasLabel"><slot /></strong>
          <span v-if="description">{{ description }}</span>
        </span>
      </span>

      <span v-if="actionIconPath || toggle" class="ui-icon-pill__actions">
        <UiButton
          v-if="actionIconPath"
          class="ui-icon-pill__action"
          :class="`ui-icon-pill__action--${actionVisibility}`"
          variant="stroke"
          size="sm"
          icon-only
          :href="actionHref"
          :target="actionTarget"
          :rel="actionRel || (actionTarget === '_blank' ? 'noopener noreferrer' : undefined)"
          :aria-label="actionLabel"
          @click.stop="emit('action', $event)"
        >
          <template #leading>
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path :d="actionIconPath" />
            </svg>
          </template>
        </UiButton>
        <UiToggle
          v-if="toggle"
          :model-value="toggleValue"
          :disabled="toggleDisabled"
          :aria-label="toggleLabel"
          @update:model-value="emit('update:toggleValue', $event)"
        />
      </span>
    </template>

    <button
      v-else-if="clickable"
      ref="trigger"
      type="button"
      class="ui-icon-pill__trigger"
      :aria-label="ariaLabel || (!hasLabel ? tooltip : undefined)"
      :aria-describedby="tooltip ? tooltipId : undefined"
      :aria-haspopup="ariaHaspopup || (hasDropdown ? 'menu' : undefined)"
      :aria-expanded="hasDropdown ? open : undefined"
      :aria-controls="hasDropdown ? dropdownId : undefined"
      @click="activate"
    >
      <span v-if="src" class="ui-icon-pill__media ui-icon-pill__media--image">
        <img :src="src" :alt="alt" width="28" height="28" loading="lazy">
      </span>
      <span
        v-else-if="$slots.icon"
        :class="iconStyle === 'circle' ? 'ui-icon-pill__media ui-icon-pill__media--icon' : 'ui-icon-pill__icon'"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>
      <span v-if="hasLabel" class="ui-icon-pill__label"><slot /></span>
    </button>

    <span
      v-else-if="variant === 'compact'"
      class="ui-icon-pill__trigger"
      :tabindex="tooltip && focusable ? 0 : undefined"
      :aria-label="ariaLabel || (!hasLabel ? tooltip : undefined)"
      :aria-describedby="tooltip ? tooltipId : undefined"
    >
      <span v-if="src" class="ui-icon-pill__media ui-icon-pill__media--image">
        <img :src="src" :alt="alt" width="28" height="28" loading="lazy">
      </span>
      <span
        v-else-if="$slots.icon"
        :class="iconStyle === 'circle' ? 'ui-icon-pill__media ui-icon-pill__media--icon' : 'ui-icon-pill__icon'"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>
      <span v-if="hasLabel" class="ui-icon-pill__label"><slot /></span>
    </span>

    <span v-if="variant === 'compact' && tooltip" :id="tooltipId" class="ui-icon-pill__tooltip" role="tooltip">
      {{ tooltip }}
    </span>

    <svg
      v-if="variant === 'compact' && hasDropdown && connected"
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
        v-if="variant === 'compact' && hasDropdown && open"
        :id="dropdownId"
        class="ui-icon-pill__dropdown"
        :role="options.length && selectionType === 'radio' ? 'radiogroup' : 'group'"
        :aria-label="dropdownLabel"
      >
        <div v-if="options.length" class="ui-icon-pill__options">
          <template v-for="(option, optionIndex) in options" :key="option.value">
            <span
              v-if="option.group && option.group !== options[optionIndex - 1]?.group"
              class="ui-icon-pill__option-group"
              role="presentation"
            >
              {{ option.group }}
            </span>
            <button
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
          </template>
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

.ui-icon-pill--catalog {
  display: flex;
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 4.375rem;
  box-sizing: border-box;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3);
  background: transparent;
  border: 1px solid var(--ll-color-metal-200);
  border-radius: var(--ll-radius-structural);
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-icon-pill--catalog:hover,
.ui-icon-pill--catalog:focus-within {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.ui-icon-pill__catalog-content {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: var(--ll-space-3);
}

.ui-icon-pill__catalog-copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.ui-icon-pill__catalog-copy strong,
.ui-icon-pill__catalog-copy > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-icon-pill__catalog-copy strong {
  color: var(--ll-color-ink);
  font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control);
}

.ui-icon-pill__catalog-copy > span {
  color: var(--ll-color-text-muted);
  font: 400 var(--ll-text-xs) / 1.35 var(--ll-font-control);
}

.ui-icon-pill__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--ll-space-2);
}

.ui-icon-pill__action--hover {
  opacity: 0;
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out);
}

.ui-icon-pill--catalog:hover .ui-icon-pill__action--hover,
.ui-icon-pill__action--hover:focus-visible { opacity: 1; }

.ui-icon-pill--catalog .ui-icon-pill__media {
  width: 2.75rem;
  height: 2.75rem;
}

.ui-icon-pill--catalog .ui-icon-pill__media--icon :deep(svg) {
  width: 1.125rem;
  height: 1.125rem;
}

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

.ui-icon-pill--circular-media .ui-icon-pill__trigger {
  gap: 0.5rem;
  padding-left: 0.125rem;
}

.ui-icon-pill--icon-only .ui-icon-pill__trigger {
  width: var(--ui-icon-pill-height);
  justify-content: center;
  padding: 0;
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

.ui-icon-pill__media {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  box-sizing: border-box;
  overflow: hidden;
  place-items: center;
  border-radius: 50%;
}

.ui-icon-pill__media--image {
  background: var(--ll-color-metal-950);
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px var(--ui-icon-pill-border);
}

.ui-icon-pill__media--image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ui-icon-pill__media--icon {
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ui-icon-pill-border);
}

.ui-icon-pill__media--icon :deep(svg) {
  display: block;
  width: 0.9375rem;
  height: 0.9375rem;
}

.ui-icon-pill__label {
  min-width: 0;
  overflow: hidden;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-icon-pill__tooltip {
  position: absolute;
  z-index: 20;
  bottom: calc(100% + var(--ll-space-2));
  left: 50%;
  width: max-content;
  max-width: 15rem;
  padding: var(--ll-space-2) var(--ll-space-3);
  pointer-events: none;
  color: var(--ll-color-metal-025);
  background: var(--ll-color-metal-950);
  border-radius: var(--ll-radius-pill);
  box-shadow: var(--ll-shadow-raised);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-control);
  opacity: 0;
  transform: translate(-50%, 0.25rem);
  transition:
    opacity var(--ll-duration-fast) var(--ll-ease-out),
    transform var(--ll-duration-fast) var(--ll-ease-out);
}

.ui-icon-pill--has-tooltip:is(:hover, :focus-within) {
  z-index: 21;
}

.ui-icon-pill--has-tooltip:is(:hover, :focus-within) .ui-icon-pill__tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

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

.ui-icon-pill__option-group {
  padding: var(--ll-space-3) var(--ll-space-3) var(--ll-space-1);
  color: var(--ll-color-primary);
  font: 650 var(--ll-text-xs) / 1 var(--ll-font-control);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-icon-pill__option-group:first-child { padding-top: var(--ll-space-1); }

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
  .ui-icon-pill__tooltip { transition: none; }
  .ui-icon-pill--catalog,
  .ui-icon-pill__action--hover { transition: none; }
}

@media (hover: none) {
  .ui-icon-pill__action--hover { opacity: 1; }
}
</style>
