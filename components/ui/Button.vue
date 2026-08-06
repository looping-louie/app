<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'stroke'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(defineProps<{
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
}>(), {
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
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isUnavailable = computed(() => props.disabled || props.loading)
const componentTag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const componentAttributes = computed(() => {
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

  return {
    type: props.type,
    disabled: isUnavailable.value,
  }
})

function handleClick(event: MouseEvent) {
  if (isUnavailable.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  emit('click', event)
}
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentAttributes"
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      `ui-button--${size}`,
      { 'ui-button--block': block, 'ui-button--loading': loading },
    ]"
    :aria-disabled="isUnavailable || undefined"
    :aria-busy="loading || undefined"
    :tabindex="isUnavailable && (to || href) ? -1 : undefined"
    @click="handleClick"
  >
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <span v-else-if="$slots.leading" class="ui-button__icon" aria-hidden="true">
      <slot name="leading" />
    </span>

    <span class="ui-button__label"><slot /></span>

    <span v-if="$slots.trailing" class="ui-button__icon" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </component>
</template>

<style scoped>
.ui-button {
  --ui-button-height: 2.5rem;
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

.ui-button--sm {
  --ui-button-height: 2.125rem;
  --ui-button-padding: 0.875rem;
}

.ui-button--lg {
  --ui-button-height: 2.875rem;
  --ui-button-padding: 1.125rem;
  --ui-button-font-size: 0.9375rem;
}

.ui-button--lg .ui-button__icon,
.ui-button--lg .ui-button__icon :deep(svg) {
  width: 1.125rem;
  height: 1.125rem;
}

.ui-button--block {
  width: 100%;
}

.ui-button__label {
  overflow: hidden;
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

@keyframes ui-button-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-button {
    transition-duration: 0.01ms;
  }

  .ui-button--stroke:active:not([aria-disabled="true"]) {
    transform: none;
  }

  .ui-button__spinner {
    animation-duration: 1.5s;
  }
}
</style>
