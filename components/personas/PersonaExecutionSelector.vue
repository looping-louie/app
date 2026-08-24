<script setup lang="ts">
import type { LinkedServiceResponse } from '~/types/api'
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'

const props = withDefaults(defineProps<{
  services: LinkedServiceResponse[]
  serviceId?: string
  modelId?: string
  serviceError?: string
  modelError?: string
  disabled?: boolean
}>(), {
  serviceId: '',
  modelId: '',
  serviceError: '',
  modelError: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:serviceId': [value: string]
  'update:modelId': [value: string]
}>()

const root = ref<HTMLElement | null>(null)
const { modelLogo } = useModelLogo()
const selectableServices = computed(() => props.services.filter(service => (
  service.enabled && service.config.configured
)))
const selectedService = computed(() => (
  selectableServices.value.find(service => service.id === props.serviceId) ?? null
))
const availableModels = computed(() => selectedService.value?.config.available_models ?? [])

function selectService(value: string | string[]) {
  if (props.disabled || typeof value !== 'string') return

  const service = selectableServices.value.find(item => item.id === value)
  if (!service) return

  emit('update:serviceId', value)
  emit(
    'update:modelId',
    service.config.available_models.includes(props.modelId)
      ? props.modelId
      : service.config.available_models.length === 1
        ? service.config.available_models[0]!
        : '',
  )
}

function selectModel(value: string | string[]) {
  if (props.disabled || typeof value !== 'string' || !availableModels.value.includes(value)) return
  emit('update:modelId', value)
}

function focus() {
  root.value?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div ref="root" class="persona-execution-selector" :aria-busy="disabled || undefined">
    <section class="persona-execution-selector__group" aria-labelledby="persona-service-title">
      <div class="persona-execution-selector__heading">
        <h3 id="persona-service-title">Connection</h3>
        <p>Choose an enabled, configured workspace connection.</p>
      </div>

      <div v-if="selectableServices.length" class="persona-execution-selector__options" role="radiogroup" aria-label="Connection">
        <UiDirectoryOption
          v-for="service in selectableServices"
          :key="service.id"
          :model-value="serviceId"
          :value="service.id"
          :title="service.name"
          :description="`${service.provider_type} · ${service.config.available_models.length} ${service.config.available_models.length === 1 ? 'model' : 'models'}`"
          selection-type="radio"
          name="persona-linked-service"
          :disabled="disabled"
          @update:model-value="selectService"
        >
          <template #media>
            <img :src="`/images/providers/${service.provider_type}.webp`" alt="">
          </template>
        </UiDirectoryOption>
      </div>
      <p v-else class="persona-execution-selector__empty">
        No enabled and configured connections are available. Connect a provider in Settings first.
      </p>
      <p v-if="serviceError" class="persona-execution-selector__error" role="alert">{{ serviceError }}</p>
    </section>

    <section v-if="selectedService" class="persona-execution-selector__group" aria-labelledby="persona-model-title">
      <div class="persona-execution-selector__heading">
        <h3 id="persona-model-title">Model</h3>
        <p>Only models deployed by {{ selectedService.name }} can be selected.</p>
      </div>

      <div v-if="availableModels.length" class="persona-execution-selector__options" role="radiogroup" aria-label="Model">
        <UiDirectoryOption
          v-for="model in availableModels"
          :key="model"
          :model-value="modelId"
          :value="model"
          :title="model"
          description="Available through this connection"
          selection-type="radio"
          name="persona-model"
          :disabled="disabled"
          @update:model-value="selectModel"
        >
          <template #media>
            <img :src="modelLogo(model)" alt="">
          </template>
        </UiDirectoryOption>
      </div>
      <p v-else class="persona-execution-selector__empty">
        This connection has no active model deployments.
      </p>
      <p v-if="modelError" class="persona-execution-selector__error" role="alert">{{ modelError }}</p>
    </section>
  </div>
</template>

<style scoped>
.persona-execution-selector { display: grid; gap: var(--ll-space-7); }
.persona-execution-selector__group { display: grid; gap: var(--ll-space-3); }
.persona-execution-selector__heading { display: grid; gap: var(--ll-space-1); }
.persona-execution-selector__heading h3 { margin: 0; color: var(--ll-color-ink); font: 600 0.95rem / 1.3 var(--ll-font-control); }
.persona-execution-selector__heading p { margin: 0; color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
.persona-execution-selector__options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ll-space-3); }
.persona-execution-selector__options :deep(.ui-directory-option) { border-radius: var(--ll-radius-pill); }
.persona-execution-selector__empty { margin: 0; padding: var(--ll-space-4); color: var(--ll-color-text-muted); background: var(--ll-color-metal-025); border: 1px dashed var(--ll-color-divider); border-radius: var(--ll-radius-structural); font: 400 var(--ll-text-sm) / 1.5 var(--ll-font-control); }
.persona-execution-selector__error { margin: 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control); }

@media (max-width: 42rem) {
  .persona-execution-selector__options { grid-template-columns: 1fr; }
}
</style>
