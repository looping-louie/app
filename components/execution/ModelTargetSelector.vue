<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'
import type { LinkedServiceResponse, ModelTarget } from '~/types/api'

const props = withDefaults(defineProps<{
  services: LinkedServiceResponse[]
  modelValue: ModelTarget | null
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
  'update:modelValue': [value: ModelTarget | null]
}>()

const { modelLogo } = useModelLogo()
const selectedServiceId = ref(props.modelValue?.linked_service_id ?? '')
const selectableServices = computed(() => props.services.filter(service => (
  service.enabled && service.config.configured && service.config.available_models.length
)))
const selectedService = computed(() => (
  selectableServices.value.find(service => service.id === selectedServiceId.value) ?? null
))

watch(() => props.modelValue, (value) => {
  if (value) selectedServiceId.value = value.linked_service_id
})

function selectService(value: string | string[]) {
  if (props.disabled || typeof value !== 'string') return
  const service = selectableServices.value.find(candidate => candidate.id === value)
  if (!service) return
  selectedServiceId.value = service.id
  const currentModel = props.modelValue?.model_id
  if (currentModel && service.config.available_models.includes(currentModel)) {
    emit('update:modelValue', { linked_service_id: service.id, model_id: currentModel })
  } else if (service.config.available_models.length === 1) {
    emit('update:modelValue', { linked_service_id: service.id, model_id: service.config.available_models[0]! })
  }
}

function selectModel(value: string | string[]) {
  if (props.disabled || typeof value !== 'string' || !selectedService.value?.config.available_models.includes(value)) return
  emit('update:modelValue', { linked_service_id: selectedService.value.id, model_id: value })
}

function clearSelection() {
  if (props.disabled) return
  selectedServiceId.value = ''
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

    <section class="execution-model-target__group" aria-label="Connection">
      <div class="execution-model-target__heading">
        <h3>Connection</h3>
        <p>Only enabled and configured workspace connections are available.</p>
      </div>
      <div v-if="selectableServices.length" class="execution-model-target__options" role="radiogroup" aria-label="Connection">
        <UiDirectoryOption
          v-for="service in selectableServices"
          :key="service.id"
          :model-value="selectedServiceId"
          :value="service.id"
          :title="service.name"
          :description="`${service.provider_type} · ${service.config.available_models.length} ${service.config.available_models.length === 1 ? 'model' : 'models'}`"
          selection-type="radio"
          name="execution-linked-service"
          :disabled="disabled"
          @update:model-value="selectService"
        >
          <template #media><img :src="`/images/providers/${service.provider_type}.webp`" alt=""></template>
        </UiDirectoryOption>
      </div>
      <p v-else class="execution-model-target__empty">No configured connection can currently serve a model.</p>
    </section>

    <section v-if="selectedService" class="execution-model-target__group" aria-label="Model">
      <div class="execution-model-target__heading">
        <h3>Model</h3>
        <p>Choose a logical model deployed by {{ selectedService.name }}.</p>
      </div>
      <div class="execution-model-target__options" role="radiogroup" aria-label="Model">
        <UiDirectoryOption
          v-for="model in selectedService.config.available_models"
          :key="model"
          :model-value="modelValue?.linked_service_id === selectedService.id ? modelValue.model_id : ''"
          :value="model"
          :title="model"
          description="Available through this connection"
          selection-type="radio"
          name="execution-model"
          :disabled="disabled"
          @update:model-value="selectModel"
        >
          <template #media><img :src="modelLogo(model)" alt=""></template>
        </UiDirectoryOption>
      </div>
    </section>

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
