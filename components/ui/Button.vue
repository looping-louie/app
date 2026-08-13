<script setup lang="ts">
export interface ButtonDropdownOption {
  value: string
  label: string
  iconPath?: string
  tone?: 'default' | 'red'
  disabled?: boolean
}

type ButtonVariant = 'primary' | 'secondary' | 'stroke' | 'metal' | 'coral'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonType = 'button' | 'submit' | 'reset'
type DropdownAlign = 'left' | 'right'

const props = withDefaults(defineProps<{
  as?: string
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  to?: string
  href?: string
  target?: string
  rel?: string
  disabled?: boolean
  loading?: boolean
  block?: boolean
  iconOnly?: boolean
  ariaLabel?: string
  dropdown?: boolean
  dropdownAlign?: DropdownAlign
  dropdownLabel?: string
  options?: ButtonDropdownOption[]
}>(), {
  as: 'button',
  variant: 'primary',
  size: 'md',
  type: 'button',
  to: undefined,
  href: undefined,
  target: undefined,
  rel: undefined,
  disabled: false,
  loading: false,
  block: false,
  iconOnly: false,
  ariaLabel: undefined,
  dropdown: false,
  dropdownAlign: 'left',
  dropdownLabel: 'Actions',
  options: () => [],
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  select: [option: ButtonDropdownOption]
}>()

const isUnavailable = computed(() => props.disabled || props.loading)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const closing = ref(false)
const confirmingValue = ref<string | null>(null)
const restoreFocusAfterClose = ref(false)
let confirmationTimer: ReturnType<typeof setTimeout> | undefined
const dropdownId = `ui-button-dropdown-${useId().replaceAll(':', '')}`
const connected = computed(() => open.value || closing.value)

const componentTag = computed(() => {
  if (props.dropdown) return 'button'
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return props.as
})

const componentAttributes = computed(() => {
  if (props.dropdown) return {
    type: 'button' as const,
    disabled: isUnavailable.value,
  }

  if (props.to) {
    return { to: props.to }
  }

  if (props.href) {
    return {
      href: props.href,
      target: props.target,
      rel: props.rel || (props.target === '_blank' ? 'noopener noreferrer' : undefined),
    }
  }

  if (props.as === 'button') return {
    type: props.type,
    disabled: isUnavailable.value,
  }

  return {}
})

function handleClick(event: MouseEvent) {
  if (isUnavailable.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  if (props.dropdown) {
    toggleDropdown()
    return
  }

  emit('click', event)
}

function toggleDropdown() {
  if (isUnavailable.value) return
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

function dropdownOptions(): HTMLButtonElement[] {
  if (!root.value) return []
  return [...root.value.querySelectorAll<HTMLButtonElement>('.ui-button-dropdown__option:not(:disabled)')]
}

async function openAndFocus(position: 'first' | 'last') {
  if (isUnavailable.value) return
  closing.value = false
  open.value = true
  await nextTick()
  const options = dropdownOptions()
  const target = position === 'first' ? options[0] : options.at(-1)
  target?.focus()
}

function selectOption(option: ButtonDropdownOption) {
  if (option.disabled || confirmingValue.value !== null) return

  emit('select', option)
  confirmingValue.value = option.value
  confirmationTimer = setTimeout(() => {
    confirmationTimer = undefined
    confirmingValue.value = null
    closeDropdown({ restoreFocus: true })
  }, 360)
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    void openAndFocus('first')
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    void openAndFocus('last')
  }
}

function onDropdownKeydown(event: KeyboardEvent) {
  const options = dropdownOptions()
  if (!options.length) return
  const currentIndex = options.indexOf(event.target as HTMLButtonElement)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    options[(currentIndex + 1 + options.length) % options.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    options[(currentIndex - 1 + options.length) % options.length]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    options[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    options.at(-1)?.focus()
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) closeDropdown()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) closeDropdown({ restoreFocus: true })
}

function onDropdownAfterLeave() {
  closing.value = false
  if (restoreFocusAfterClose.value) trigger.value?.focus()
  restoreFocusAfterClose.value = false
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
    v-if="dropdown"
    ref="root"
    class="ui-button-dropdown"
    :class="[
      `ui-button-dropdown--align-${dropdownAlign}`,
      `ui-button-dropdown--${variant}`,
      {
        'ui-button-dropdown--block': block,
        'ui-button-dropdown--open': connected,
        'ui-button-dropdown--closing': closing,
      },
    ]"
  >
    <button
      ref="trigger"
      v-bind="componentAttributes"
      class="ui-button"
      :class="[
        `ui-button--${variant}`,
        `ui-button--${size}`,
        {
          'ui-button--block': block,
          'ui-button--loading': loading,
          'ui-button--icon-only': iconOnly,
        },
      ]"
      :aria-label="ariaLabel"
      :aria-disabled="isUnavailable || undefined"
      :aria-busy="loading || undefined"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="dropdownId"
      @click="handleClick"
      @keydown="onTriggerKeydown"
    >
      <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
      <span v-else-if="$slots.leading" class="ui-button__icon" aria-hidden="true">
        <slot name="leading" />
      </span>

      <span v-if="$slots.default" class="ui-button__label"><slot /></span>

      <span v-if="$slots.trailing" class="ui-button__icon" aria-hidden="true">
        <slot name="trailing" />
      </span>
      <span v-if="!iconOnly" class="ui-button__icon ui-button-dropdown__indicator" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <svg
      v-if="connected"
      class="ui-button-dropdown__shoulder"
      viewBox="0 0 16 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path class="ui-button-dropdown__shoulder-fill" d="M0 0 Q0 16 16 16 H0 Z" />
      <path class="ui-button-dropdown__shoulder-stroke" d="M0 0 Q0 16 16 16" vector-effect="non-scaling-stroke" />
    </svg>

    <Transition name="ui-button-dropdown" @after-leave="onDropdownAfterLeave">
      <div
        v-if="open"
        :id="dropdownId"
        class="ui-button-dropdown__menu"
        role="menu"
        :aria-label="dropdownLabel"
        @keydown="onDropdownKeydown"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="ui-button-dropdown__option"
          :class="{
            'ui-button-dropdown__option--red': option.tone === 'red',
            'is-confirming': confirmingValue === option.value,
          }"
          role="menuitem"
          :disabled="option.disabled"
          @click="selectOption(option)"
        >
          <span class="ui-button-dropdown__option-icon" aria-hidden="true">
            <slot name="option-icon" :option="option">
              <svg v-if="option.iconPath" viewBox="0 0 256 256" fill="currentColor">
                <path :d="option.iconPath" />
              </svg>
            </slot>
          </span>
          <span class="ui-button-dropdown__option-label">{{ option.label }}</span>
        </button>
      </div>
    </Transition>
  </div>

  <component
    v-else
    :is="componentTag"
    v-bind="componentAttributes"
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      `ui-button--${size}`,
      {
        'ui-button--block': block,
        'ui-button--loading': loading,
        'ui-button--icon-only': iconOnly,
      },
    ]"
    :aria-label="ariaLabel"
    :aria-disabled="isUnavailable || undefined"
    :aria-busy="loading || undefined"
    :tabindex="isUnavailable && (to || href) ? -1 : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <span v-else-if="$slots.leading" class="ui-button__icon" aria-hidden="true">
      <slot name="leading" />
    </span>

    <span v-if="$slots.default" class="ui-button__label"><slot /></span>

    <span v-if="$slots.trailing" class="ui-button__icon" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </component>
</template>

<style scoped>
.ui-button {
  --ui-button-height: 2.125rem;
  --ui-button-padding: 0.875rem;
  --ui-button-font-size: 0.90625rem;

  display: inline-flex;
  min-width: 0;
  height: var(--ui-button-height);
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  padding: 0 var(--ui-button-padding);
  border: 2px solid transparent;
  border-radius: 57px;
  font: 470 var(--ui-button-font-size) / 1 var(--ll-font-control);
  letter-spacing: 0;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--ll-duration-normal) var(--ll-ease-out),
    background-color var(--ll-duration-normal) var(--ll-ease-out),
    border-color 150ms ease,
    transform 150ms ease;
  -webkit-tap-highlight-color: transparent;
}

.ui-button-dropdown {
  --ui-button-dropdown-trigger-radius: 1rem;
  --ui-button-dropdown-shoulder: 1rem;
  --ui-button-dropdown-menu-offset: 2px;
  --ui-button-dropdown-radius: var(--ll-radius-lg);
  --ui-button-dropdown-surface: var(--ll-color-card);
  --ui-button-dropdown-option-hover: var(--ll-color-highlight);
  --ui-button-dropdown-border: var(--ll-color-divider);
  --ui-button-dropdown-text: var(--ll-color-ink);

  position: relative;
  z-index: 0;
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

.ui-button-dropdown--primary {
  --ui-button-dropdown-surface: var(--ll-color-primary);
  --ui-button-dropdown-option-hover: var(--ll-color-primary-hover);
  --ui-button-dropdown-border: var(--ll-color-primary-depth);
  --ui-button-dropdown-text: #f4f8fb;
}

.ui-button-dropdown--secondary {
  --ui-button-dropdown-surface: #e7e6e2;
  --ui-button-dropdown-option-hover: #eeede9;
  --ui-button-dropdown-border: #bebdb7;
  --ui-button-dropdown-text: var(--ll-color-ink);
}

.ui-button-dropdown--stroke {
  --ui-button-dropdown-surface: #f7f6f3;
  --ui-button-dropdown-option-hover: #fcfbf8;
  --ui-button-dropdown-border: #d2d1cb;
  --ui-button-dropdown-text: #333333;
}

.ui-button-dropdown--metal {
  --ui-button-dropdown-surface: var(--ll-color-metal-950);
  --ui-button-dropdown-option-hover: #343c41;
  --ui-button-dropdown-border: #050607;
  --ui-button-dropdown-text: var(--ll-color-metal-100);
}

.ui-button-dropdown--coral {
  --ui-button-dropdown-surface: var(--ll-color-brand-bright);
  --ui-button-dropdown-option-hover: #ef6e80;
  --ui-button-dropdown-border: var(--ll-color-brand);
  --ui-button-dropdown-text: var(--ll-color-metal-025);
}

.ui-button-dropdown--block {
  display: block;
  width: 100%;
}

.ui-button-dropdown--open { z-index: 20; }

.ui-button-dropdown--open > .ui-button {
  position: relative;
  z-index: 3;
  border-top-left-radius: var(--ui-button-dropdown-trigger-radius);
  border-top-right-radius: var(--ui-button-dropdown-trigger-radius);
  border-color: var(--ui-button-dropdown-border);
  border-bottom-color: transparent;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
  background-color: var(--ui-button-dropdown-surface);
  background-image: none;
  box-shadow: none;
  transform: none;
}

.ui-button-dropdown--open::after {
  position: absolute;
  z-index: 2;
  top: calc(100% - 2px);
  left: 1px;
  width: calc(100% + var(--ui-button-dropdown-shoulder) - 2px);
  height: calc(var(--ui-button-dropdown-menu-offset) + 4px);
  background: var(--ui-button-dropdown-surface);
  opacity: 1;
  pointer-events: none;
  content: '';
  transition: opacity 80ms ease-out;
}

.ui-button-dropdown--align-right.ui-button-dropdown--open::after {
  right: 1px;
  left: auto;
}

.ui-button-dropdown__indicator {
  transition: transform 180ms var(--ll-ease-out);
}

.ui-button-dropdown--open .ui-button-dropdown__indicator {
  transform: rotate(180deg);
}

.ui-button-dropdown__shoulder {
  position: absolute;
  z-index: 4;
  top: calc(
    100% - var(--ui-button-dropdown-shoulder)
    + var(--ui-button-dropdown-menu-offset) + 0.5px
  );
  left: calc(100% - 1px);
  width: var(--ui-button-dropdown-shoulder);
  height: var(--ui-button-dropdown-shoulder);
  overflow: visible;
  opacity: 1;
  pointer-events: none;
  transition: opacity 80ms ease-out;
}

.ui-button-dropdown--closing::after,
.ui-button-dropdown--closing .ui-button-dropdown__shoulder {
  opacity: 0;
}

.ui-button-dropdown--align-right .ui-button-dropdown__shoulder {
  right: calc(100% - 1px);
  left: auto;
  transform: scaleX(-1);
}

.ui-button-dropdown__shoulder-fill { fill: var(--ui-button-dropdown-surface); }
.ui-button-dropdown__shoulder-stroke {
  fill: none;
  stroke: var(--ui-button-dropdown-border);
  stroke-width: 1px;
}

.ui-button-dropdown__menu {
  position: absolute;
  z-index: 1;
  top: calc(100% + var(--ui-button-dropdown-menu-offset));
  left: 0;
  display: grid;
  width: max(18rem, 100%);
  max-width: calc(100vw - 2rem);
  box-sizing: border-box;
  gap: var(--ll-space-1);
  padding: var(--ll-space-4);
  color: var(--ui-button-dropdown-text);
  background: var(--ui-button-dropdown-surface);
  border: 1px solid var(--ui-button-dropdown-border);
  border-radius: 0 var(--ui-button-dropdown-radius) var(--ui-button-dropdown-radius);
  box-shadow: var(--ll-shadow-raised);
  transform-origin: top left;
}

.ui-button-dropdown--align-right .ui-button-dropdown__menu {
  right: 0;
  left: auto;
  border-radius: var(--ui-button-dropdown-radius) 0 var(--ui-button-dropdown-radius) var(--ui-button-dropdown-radius);
  transform-origin: top right;
}

.ui-button-dropdown__option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3);
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: var(--ll-radius-md);
  font: 500 var(--ll-text-sm) / 1.2 var(--ll-font-control);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-button-dropdown__option:hover:not(:disabled),
.ui-button-dropdown__option:focus-visible { background: var(--ui-button-dropdown-option-hover); }
.ui-button-dropdown__option--red { color: var(--ll-color-brand); }
.ui-button-dropdown__option:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.ui-button-dropdown__option:disabled { cursor: not-allowed; opacity: 0.48; }
.ui-button-dropdown__option.is-confirming {
  animation: ui-button-dropdown-confirm 360ms ease-in-out both;
  pointer-events: none;
}

.ui-button-dropdown__option-icon {
  display: grid;
  width: 1rem;
  height: 1rem;
  flex: none;
  place-items: center;
  color: inherit;
  opacity: 0.72;
}

.ui-button-dropdown__option-icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.ui-button-dropdown__option-label {
  min-width: 0;
  line-height: 1.25;
}

.ui-button-dropdown-enter-active,
.ui-button-dropdown-leave-active {
  transition: opacity 180ms cubic-bezier(0.55, 0, 1, 0.45), transform 220ms cubic-bezier(0.55, 0, 1, 0.45);
}

.ui-button-dropdown-enter-from,
.ui-button-dropdown-leave-to { opacity: 0; transform: scaleY(0.96); }

@keyframes ui-button-dropdown-confirm {
  0%, 50%, 100% { background: var(--ui-button-dropdown-option-hover); }
  25%, 75% { background: transparent; }
}

.ui-button:focus-visible {
  outline: 2px solid var(--ll-color-ink);
  outline-offset: 2px;
}

.ui-button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.48;
}

.ui-button--primary {
  --ui-button-primary-fill: var(--ll-color-primary);
  --ui-button-primary-border-start: var(--ll-color-primary-highlight);
  --ui-button-primary-border-end: var(--ll-color-primary-depth);

  color: #f4f8fb;
  background-image:
    linear-gradient(var(--ui-button-primary-fill), var(--ui-button-primary-fill)),
    linear-gradient(180deg, var(--ui-button-primary-border-start) 0%, var(--ui-button-primary-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  border-width: 1.5px;
  border-color: transparent;
  box-shadow: 0 4px 9px rgba(11, 45, 70, 0.28);
  font-weight: 500;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ui-button--primary:hover:not([aria-disabled="true"]) {
  --ui-button-primary-fill: var(--ll-color-primary-hover);
  --ui-button-primary-border-start: var(--ll-color-primary-highlight-hover);
  --ui-button-primary-border-end: var(--ll-color-primary-depth-hover);
}

.ui-button--primary:active:not([aria-disabled="true"]) {
  transform: scale(0.98);
}

.ui-button--secondary {
  --ui-button-secondary-fill: #e7e6e2;
  --ui-button-secondary-border-start: #ffffff;
  --ui-button-secondary-border-end: #bebdb7;

  color: var(--ll-color-ink);
  background-image:
    linear-gradient(var(--ui-button-secondary-fill), var(--ui-button-secondary-fill)),
    linear-gradient(180deg, var(--ui-button-secondary-border-start) 0%, var(--ui-button-secondary-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  border-width: 1.5px;
  border-color: transparent;
  box-shadow: 0 4px 9px rgba(25, 26, 23, 0.12);
}

.ui-button--secondary:hover:not([aria-disabled="true"]) {
  --ui-button-secondary-fill: #eeede9;
  --ui-button-secondary-border-start: #ffffff;
  --ui-button-secondary-border-end: #c9c8c2;
}

.ui-button--secondary:active:not([aria-disabled="true"]) {
  transform: scale(0.98);
}

.ui-button--stroke {
  --ui-button-stroke-fill: #f7f6f3;
  --ui-button-stroke-border-start: #ffffff;
  --ui-button-stroke-border-end: #d2d1cb;

  color: #333333;
  background-image:
    linear-gradient(var(--ui-button-stroke-fill), var(--ui-button-stroke-fill)),
    linear-gradient(180deg, var(--ui-button-stroke-border-start) 0%, var(--ui-button-stroke-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  border-width: 1.5px;
  border-color: transparent;
  box-shadow: 0 4px 9px rgba(25, 26, 23, 0.1);
}

.ui-button--stroke:hover:not([aria-disabled="true"]) {
  --ui-button-stroke-fill: #fcfbf8;
  --ui-button-stroke-border-start: #ffffff;
  --ui-button-stroke-border-end: #dad9d4;
}

.ui-button--stroke:active:not([aria-disabled="true"]) {
  transform: scale(0.98);
}

.ui-button--metal {
  --ui-button-metal-fill: var(--ll-color-metal-950);
  --ui-button-metal-border-start: #ffffff;
  --ui-button-metal-border-end: #050607;

  color: var(--ll-color-metal-100);
  background-image:
    linear-gradient(var(--ui-button-metal-fill), var(--ui-button-metal-fill)),
    linear-gradient(180deg, var(--ui-button-metal-border-start) 0%, var(--ui-button-metal-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  border-width: 1.5px;
  border-color: transparent;
  box-shadow: 0 4px 9px rgba(17, 21, 24, 0.34);
}

.ui-button--metal:hover:not([aria-disabled="true"]) {
  --ui-button-metal-fill: #343c41;
  --ui-button-metal-border-start: #ffffff;
  --ui-button-metal-border-end: #090b0c;
}

.ui-button--metal:active:not([aria-disabled="true"]) {
  transform: scale(0.98);
}

.ui-button--coral {
  --ui-button-coral-fill: var(--ll-color-brand-bright);
  --ui-button-coral-border-start: var(--ll-color-red-100);
  --ui-button-coral-border-end: var(--ll-color-brand);

  color: var(--ll-color-metal-025);
  background-image:
    linear-gradient(var(--ui-button-coral-fill), var(--ui-button-coral-fill)),
    linear-gradient(180deg, var(--ui-button-coral-border-start) 0%, var(--ui-button-coral-border-end) 100%);
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  border-width: 1.5px;
  border-color: transparent;
  box-shadow: 0 4px 9px rgba(134, 17, 34, 0.22);
  font-weight: 500;
}

.ui-button--coral:hover:not([aria-disabled="true"]) {
  --ui-button-coral-fill: #ef6e80;
  --ui-button-coral-border-start: #fff5f7;
  --ui-button-coral-border-end: var(--ll-color-red-700);
}

.ui-button--coral:active:not([aria-disabled="true"]) {
  transform: scale(0.98);
}

.ui-button--sm {
  --ui-button-height: 1.75rem;
  --ui-button-padding: 0.75rem;
  --ui-button-font-size: 0.8125rem;

  gap: 0.375rem;
}

.ui-button--lg {
  --ui-button-height: 2.5rem;
  --ui-button-padding: 0.875rem;
  --ui-button-font-size: 0.90625rem;
}

.ui-button--sm .ui-button__icon,
.ui-button--sm .ui-button__icon :deep(svg) {
  width: 0.875rem;
  height: 0.875rem;
}

.ui-button--block {
  width: 100%;
}

.ui-button--icon-only {
  width: var(--ui-button-height);
  padding-inline: 0;
}

.ui-button__label {
  overflow: hidden;
  line-height: 1.2;
  text-overflow: ellipsis;
}

.ui-button__icon,
.ui-button__icon :deep(svg) {
  display: block;
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

.ui-button__spinner {
  width: 0.9375rem;
  height: 0.9375rem;
  flex: 0 0 auto;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ui-button-spin 650ms linear infinite;
}

.ui-button--sm .ui-button__spinner {
  width: 0.8125rem;
  height: 0.8125rem;
}

@keyframes ui-button-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-button {
    transition-duration: 0.01ms;
  }

  .ui-button--stroke:active:not([aria-disabled="true"]),
  .ui-button--coral:active:not([aria-disabled="true"]) {
    transform: none;
  }

  .ui-button__spinner {
    animation-duration: 1.5s;
  }

  .ui-button-dropdown-enter-active,
  .ui-button-dropdown-leave-active { transition: none; }

  .ui-button-dropdown__shoulder,
  .ui-button-dropdown--open::after { transition: none; }

  .ui-button-dropdown__option.is-confirming { animation: none; }
}
</style>
