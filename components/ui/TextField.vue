<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string
  label: string
  multiline?: boolean
  rows?: number
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
}>(), {
  modelValue: '',
  multiline: false,
  rows: 6,
  hint: undefined,
  error: undefined,
  required: false,
  hideLabel: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const control = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const fieldId = `ui-text-field-${useId().replaceAll(':', '')}`
const messageId = `${fieldId}-message`

function updateValue(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function focus() {
  control.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <label class="ui-text-field" :class="{ 'ui-text-field--error': error }">
    <span v-if="!hideLabel" class="ui-text-field__label">{{ label }}<span v-if="required" aria-hidden="true"> *</span></span>
    <textarea
      v-if="multiline"
      :id="fieldId"
      ref="control"
      v-bind="$attrs"
      class="ui-text-field__control ui-text-field__control--textarea"
      :value="modelValue"
      :rows="rows"
      :required="required"
      :aria-label="hideLabel ? label : undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="hint || error ? messageId : undefined"
      @input="updateValue"
    />
    <input
      v-else
      :id="fieldId"
      ref="control"
      v-bind="$attrs"
      class="ui-text-field__control"
      :value="modelValue"
      :required="required"
      :aria-label="hideLabel ? label : undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="hint || error ? messageId : undefined"
      @input="updateValue"
    >
    <span v-if="error || hint" :id="messageId" class="ui-text-field__message" :role="error ? 'alert' : undefined">
      {{ error || hint }}
    </span>
  </label>
</template>

<style scoped>
.ui-text-field { display: grid; min-width: 0; gap: var(--ll-space-2); }
.ui-text-field__label { color: var(--ll-color-ink); font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control); }
.ui-text-field__control {
  width: 100%;
  min-width: 0;
  height: 3rem;
  box-sizing: border-box;
  padding: 0 var(--ll-space-8);
  color: var(--ll-color-ink);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
  font: 450 1rem / 1.5 var(--ll-font-control);
  transition: border-color var(--ll-duration-normal) var(--ll-ease-out), box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}
.ui-text-field__control--textarea {
  height: auto;
  min-height: 10rem;
  padding-block: var(--ll-space-6);
  resize: vertical;
}
.ui-text-field__control::placeholder { color: var(--ll-color-text-muted); opacity: 0.75; }
.ui-text-field__control:focus { border-color: var(--ll-color-primary); box-shadow: 0 0 0 3px var(--ll-color-primary-highlight); outline: none; }
.ui-text-field--error .ui-text-field__control { border-color: var(--ll-color-brand); }
.ui-text-field__message { color: var(--ll-color-text-muted); font: 400 var(--ll-text-xs) / 1.4 var(--ll-font-control); }
.ui-text-field--error .ui-text-field__message { color: var(--ll-color-brand); }
</style>
