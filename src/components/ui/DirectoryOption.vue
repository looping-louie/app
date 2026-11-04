<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'

type SelectionType = 'radio' | 'checkbox'

const props = withDefaults(defineProps<{
  value: string
  modelValue?: string | string[]
  selectionType?: SelectionType
  name?: string
  title: string
  description?: string
  disabled?: boolean
  externalHref?: string
  externalLabel?: string
}>(), {
  modelValue: undefined,
  selectionType: 'radio',
  name: undefined,
  description: undefined,
  disabled: false,
  externalHref: undefined,
  externalLabel: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const selected = computed(() => (
  props.selectionType === 'checkbox'
    ? Array.isArray(props.modelValue) && props.modelValue.includes(props.value)
    : props.modelValue === props.value
))

function updateSelection() {
  if (props.disabled) return
  if (props.selectionType === 'radio') {
    emit('update:modelValue', props.value)
    return
  }

  const current = Array.isArray(props.modelValue) ? props.modelValue : []
  emit(
    'update:modelValue',
    current.includes(props.value)
      ? current.filter(value => value !== props.value)
      : [...current, props.value],
  )
}
</script>

<template>
  <div
    class="ui-directory-option"
    :class="{
      'ui-directory-option--selected': selected,
      'ui-directory-option--disabled': disabled,
      'ui-directory-option--has-external': externalHref,
    }"
  >
    <label class="ui-directory-option__choice">
      <input
        :type="selectionType"
        :name="name"
        :value="value"
        :checked="selected"
        :disabled="disabled"
        @change="updateSelection"
      >
      <span v-if="$slots.media" class="ui-directory-option__media" aria-hidden="true">
        <slot name="media" />
      </span>
      <span class="ui-directory-option__copy">
        <strong>{{ title }}</strong>
        <span v-if="description">{{ description }}</span>
        <slot name="meta" />
      </span>
      <span class="ui-directory-option__check" aria-hidden="true">
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
        </svg>
      </span>
    </label>

    <UiButton
      v-if="externalHref"
      class="ui-directory-option__external"
      variant="stroke"
      size="sm"
      icon-only
      :href="externalHref"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="externalLabel || `Open ${title} in a new tab`"
      @click.stop
    >
      <template #leading>
        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
          <path d="M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z" />
        </svg>
      </template>
    </UiButton>
  </div>
</template>

<style scoped>
.ui-directory-option {
  position: relative;
  min-width: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ll-radius-structural);
  transition: background var(--ll-duration-normal) var(--ll-ease-out), border-color var(--ll-duration-normal) var(--ll-ease-out), box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-directory-option:hover,
.ui-directory-option:focus-within {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.ui-directory-option.ui-directory-option--selected {
  background: var(--ll-color-primary-highlight);
  border-color: var(--ll-color-primary);
}

.ui-directory-option__choice {
  display: flex;
  min-height: 0;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3) 3rem var(--ll-space-3) var(--ll-space-3);
  cursor: pointer;
}

.ui-directory-option__choice > input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.ui-directory-option:has(input:focus-visible) { outline: 2px solid var(--ll-color-primary); outline-offset: 2px; }
.ui-directory-option--disabled { opacity: 0.48; }
.ui-directory-option--disabled .ui-directory-option__choice { cursor: not-allowed; }

.ui-directory-option__media {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  place-items: center;
  overflow: hidden;
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: 50%;
}

.ui-directory-option__media :deep(img),
.ui-directory-option__media :deep(svg) { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-directory-option__media :deep(svg) { padding: 0.65rem; box-sizing: border-box; }

.ui-directory-option__copy { display: grid; min-width: 0; gap: 0.2rem; }
.ui-directory-option__copy strong { color: var(--ll-color-ink); font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control); }
.ui-directory-option__copy > span { color: var(--ll-color-text-muted); font: 400 var(--ll-text-xs) / 1.35 var(--ll-font-control); }

.ui-directory-option__check {
  position: absolute;
  top: 50%;
  right: var(--ll-space-3);
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  place-items: center;
  color: var(--ll-color-metal-025);
  background: var(--ll-color-primary);
  border-radius: 50%;
  opacity: 0;
  transform: translateY(-50%) scale(0.7);
  transition: opacity 150ms ease, transform 150ms ease;
}

.ui-directory-option__check svg { width: 0.8rem; height: 0.8rem; }
.ui-directory-option--selected .ui-directory-option__check { opacity: 1; transform: translateY(-50%) scale(1); }
.ui-directory-option--has-external .ui-directory-option__choice { padding-right: 4.75rem; }
.ui-directory-option--has-external .ui-directory-option__check { right: 3.35rem; }

.ui-directory-option__external {
  position: absolute;
  z-index: 2;
  top: 50%;
  right: var(--ll-space-3);
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 120ms ease;
}

.ui-directory-option:hover .ui-directory-option__external,
.ui-directory-option__external:focus-visible { opacity: 1; }

@media (hover: none) { .ui-directory-option__external { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ui-directory-option, .ui-directory-option__check, .ui-directory-option__external { transition: none; } }
</style>
