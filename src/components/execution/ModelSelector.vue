<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'
import type { ExecutionHarness, ModelSummary } from '~/types/api'
import { isModelSelectableForHarness } from '~/utils/executionHarnesses'

const props = withDefaults(defineProps<{
  models: ModelSummary[]
  modelValue: string | null
  harness?: ExecutionHarness | null
  inheritLabel?: string
  inheritDescription?: string
  error?: string
  disabled?: boolean
}>(), {
  inheritLabel: 'Inherit model',
  inheritDescription: 'Use the next configured execution scope.',
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { modelLogo, providerLogo } = useModelLogo()
const usesCodex = computed(() => props.harness?.kind === 'codex_cli')
const selectableModels = computed(() => props.models.filter(model => (
  isModelSelectableForHarness(model, props.harness)
)))
const currentModelUnavailable = computed(() => {
  if (!props.modelValue) return false
  return !selectableModels.value.some(model => model.id === props.modelValue)
})

function selectModel(value: string | string[]) {
  if (props.disabled || typeof value !== 'string' || !selectableModels.value.some(model => model.id === value)) return
  emit('update:modelValue', value)
}

function clearSelection() {
  if (props.disabled) return
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="execution-model-target" :aria-busy="disabled || undefined">
    <div class="execution-model-target__inherit">
      <div>
        <strong>{{ inheritLabel }}</strong>
        <p>{{ inheritDescription }}</p>
      </div>
      <UiButton size="sm" :variant="modelValue ? 'stroke' : 'secondary'" :disabled="disabled || !modelValue" @click="clearSelection">
        {{ modelValue ? 'Use inheritance' : 'Selected' }}
      </UiButton>
    </div>

    <section class="execution-model-target__group" aria-label="Model">
      <div class="execution-model-target__heading">
        <h3>Model</h3>
        <p v-if="usesCodex">Choose an enabled logical model. Final availability depends on the authenticated Codex CLI in the worker.</p>
        <p v-else>Choose an available logical model. Louie selects a usable connection when the run is created.</p>
      </div>
      <div v-if="selectableModels.length" class="execution-model-target__options" role="radiogroup" aria-label="Model">
        <UiDirectoryOption
          v-for="model in selectableModels"
          :key="model.id"
          :model-value="modelValue ?? ''"
          :value="model.id"
          :title="model.name"
          :description="`${model.vendor} · ${model.family}`"
          selection-type="radio"
          name="execution-model"
          :disabled="disabled"
          @update:model-value="selectModel"
        >
          <template #media><img :src="providerLogo(model.vendor, model.family) || modelLogo(model.id)" alt=""></template>
        </UiDirectoryOption>
      </div>
      <p v-else class="execution-model-target__empty">
        {{ usesCodex ? 'No model is currently enabled for Codex CLI.' : 'No model is currently available.' }}
      </p>
    </section>

    <p v-if="currentModelUnavailable" class="execution-model-target__error" role="alert">
      The saved model is no longer available. Choose another model or use inheritance.
    </p>
    <p v-if="error" class="execution-model-target__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.execution-model-target { display: grid; gap: var(--ll-space-6); }
.execution-model-target__inherit { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding: var(--ll-space-4); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.execution-model-target__inherit div, .execution-model-target__group, .execution-model-target__heading { display: grid; gap: var(--ll-space-1); }
.execution-model-target__inherit strong, .execution-model-target__heading h3 { margin: 0; color: var(--ll-color-ink); font: 600 var(--ll-text-sm) / 1.3 var(--ll-font-control); }
.execution-model-target__inherit p, .execution-model-target__heading p { margin: 0; color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
.execution-model-target__group { gap: var(--ll-space-3); }
.execution-model-target__options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ll-space-3); }
.execution-model-target__options :deep(.ui-directory-option) { border-radius: var(--ll-radius-pill); }
.execution-model-target__empty { margin: 0; padding: var(--ll-space-4); color: var(--ll-color-text-muted); background: var(--ll-color-metal-025); border: 1px dashed var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.execution-model-target__error { margin: 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control); }
@media (max-width: 42rem) { .execution-model-target__options { grid-template-columns: 1fr; } .execution-model-target__inherit { align-items: flex-start; flex-direction: column; } }
</style>
