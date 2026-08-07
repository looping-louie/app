<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  disabled?: boolean
  readonly?: boolean
  ariaLabel?: string
}>(), {
  disabled: false,
  readonly: false,
  ariaLabel: 'Toggle setting',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const rootComponent = computed(() => props.readonly ? 'span' : 'button')

function toggle() {
  if (props.disabled || props.readonly) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <component
    :is="rootComponent"
    class="ui-toggle"
    :class="{
      'ui-toggle--checked': modelValue,
      'ui-toggle--disabled': disabled,
      'ui-toggle--readonly': readonly,
    }"
    :type="readonly ? undefined : 'button'"
    :role="readonly ? 'img' : 'switch'"
    :aria-checked="readonly ? undefined : modelValue"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || undefined"
    :disabled="readonly ? undefined : disabled"
    @click="toggle"
  >
    <span class="ui-toggle__thumb" aria-hidden="true">
      <span class="ui-toggle__icon ui-toggle__icon--off">
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        </svg>
      </span>
      <span class="ui-toggle__icon ui-toggle__icon--on">
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </span>
    </span>
  </component>
</template>

<style scoped>
.ui-toggle {
  position: relative;
  display: inline-flex;
  width: 2.75rem;
  height: 1.5rem;
  flex: none;
  align-items: center;
  padding: 0.125rem;
  appearance: none;
  background: var(--ll-color-metal-400);
  border: 0;
  border-radius: var(--ll-radius-pill);
  box-shadow: inset 0 0 0 1px rgba(41, 47, 51, 0.08);
  cursor: pointer;
  transition:
    background-color var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-toggle--checked {
  background: var(--ll-color-primary);
  box-shadow: inset 0 0 0 1px var(--ll-color-primary-depth);
}

.ui-toggle__thumb {
  position: relative;
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(41, 47, 51, 0.28);
  transform: translateX(0);
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.ui-toggle__icon {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--ll-color-metal-700);
  opacity: 1;
  transition: opacity 200ms ease-in;
}

.ui-toggle__icon svg {
  width: 0.75rem;
  height: 0.75rem;
}

.ui-toggle__icon--on {
  color: var(--ll-color-primary);
  opacity: 0;
  transition-duration: 100ms;
  transition-timing-function: ease-out;
}

.ui-toggle--checked .ui-toggle__thumb {
  transform: translateX(1.25rem);
}

.ui-toggle--checked .ui-toggle__icon--off {
  opacity: 0;
  transition-duration: 100ms;
  transition-timing-function: ease-out;
}

.ui-toggle--checked .ui-toggle__icon--on {
  opacity: 1;
  transition-duration: 200ms;
  transition-timing-function: ease-in;
}

.ui-toggle:not(.ui-toggle--readonly):hover:not(:disabled) {
  background: var(--ll-color-metal-500);
}

.ui-toggle--checked:not(.ui-toggle--readonly):hover:not(:disabled) {
  background: var(--ll-color-primary-hover);
}

.ui-toggle:focus-visible {
  outline: 2px solid var(--ll-color-signal-ink);
  outline-offset: 3px;
}

.ui-toggle--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ui-toggle--readonly {
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .ui-toggle,
  .ui-toggle__thumb,
  .ui-toggle__icon {
    transition: none;
  }
}
</style>
