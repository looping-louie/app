<script setup lang="ts">
import type { LinkedServiceResponse } from '~/types/api'
import PersonaExecutionSelector from '~/components/personas/PersonaExecutionSelector.vue'
import UiButton from '~/components/ui/Button.vue'

const props = withDefaults(defineProps<{
  services: LinkedServiceResponse[]
  serviceId?: string
  modelId?: string
  editing?: boolean
  loading?: boolean
  loadError?: boolean
  selectionError?: string
  disabled?: boolean
}>(), {
  serviceId: '',
  modelId: '',
  editing: false,
  loading: false,
  loadError: false,
  selectionError: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:serviceId': [value: string]
  'update:modelId': [value: string]
  retry: []
}>()

const selectedService = computed(() => props.services.find(service => service.id === props.serviceId) ?? null)
const state = computed(() => {
  if (!props.serviceId || !props.modelId) return { label: 'Setup required', tone: 'warning' }
  if (!selectedService.value) return { label: 'Connection missing', tone: 'warning' }
  if (!selectedService.value.enabled) return { label: 'Connection disabled', tone: 'warning' }
  if (!selectedService.value.config.configured) return { label: 'Needs configuration', tone: 'warning' }
  if (!selectedService.value.config.available_models.includes(props.modelId)) return { label: 'Model unavailable', tone: 'warning' }
  return { label: 'Ready', tone: 'ready' }
})
</script>

<template>
  <section class="persona-execution-panel" aria-labelledby="persona-execution-title">
    <div class="persona-execution-panel__heading">
      <h2 id="persona-execution-title">Execution</h2>
      <span class="persona-execution-panel__status" :class="`persona-execution-panel__status--${state.tone}`">{{ state.label }}</span>
    </div>

    <div v-if="loading" class="persona-execution-panel__state" role="status">Loading connections…</div>
    <div v-else-if="loadError" class="persona-execution-panel__state persona-execution-panel__state--error" role="alert">
      <span>Connections could not be loaded.</span>
      <UiButton size="sm" variant="stroke" @click="emit('retry')">Retry</UiButton>
    </div>

    <PersonaExecutionSelector
      v-else-if="editing"
      :services="services"
      :service-id="serviceId"
      :model-id="modelId"
      :service-error="selectionError"
      :disabled="disabled"
      @update:service-id="emit('update:serviceId', $event)"
      @update:model-id="emit('update:modelId', $event)"
    />

    <dl v-else-if="serviceId && modelId" class="persona-execution-panel__details">
      <div>
        <dt>Connection</dt>
        <dd>{{ selectedService?.name ?? serviceId }}</dd>
      </div>
      <div>
        <dt>Provider</dt>
        <dd>{{ selectedService?.provider_type ?? 'Unavailable' }}</dd>
      </div>
      <div>
        <dt>Model</dt>
        <dd>{{ modelId }}</dd>
      </div>
    </dl>

    <p v-else class="persona-execution-panel__missing">
      This agent has no executable connection and model selection. Edit it to repair the setup before using it in a run.
    </p>
  </section>
</template>

<style scoped>
.persona-execution-panel { display: grid; gap: var(--ll-space-4); padding: var(--ll-space-4); background: var(--ll-color-card); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.persona-execution-panel__heading { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-3); }
.persona-execution-panel__heading h2 { margin: 0; color: var(--ll-color-ink); font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control); }
.persona-execution-panel__status { padding: 0.15rem 0.5rem; border-radius: var(--ll-radius-pill); font: 600 var(--ll-text-xs) / 1.25 var(--ll-font-control); }
.persona-execution-panel__status--ready { color: var(--ll-color-primary); background: var(--ll-color-primary-highlight); }
.persona-execution-panel__status--warning { color: var(--ll-color-brand-ink); background: var(--ll-color-highlight); }
.persona-execution-panel__state { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ll-space-2); color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
.persona-execution-panel__state--error { color: var(--ll-color-brand-ink); }
.persona-execution-panel__details { display: grid; gap: var(--ll-space-3); margin: 0; }
.persona-execution-panel__details div { display: grid; min-width: 0; gap: 0.1rem; }
.persona-execution-panel__details dt { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
.persona-execution-panel__details dd { overflow-wrap: anywhere; margin: 0; color: var(--ll-color-ink); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); }
.persona-execution-panel__missing { margin: 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-xs) / 1.5 var(--ll-font-control); }
.persona-execution-panel :deep(.persona-execution-selector__options) { grid-template-columns: 1fr; }
</style>
