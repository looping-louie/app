<script setup lang="ts">
import ExecutionHarnessSelector from '~/components/execution/HarnessSelector.vue'
import ExecutionModelTargetSelector from '~/components/execution/ModelTargetSelector.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import type { ExecutionHarness, ModelTarget } from '~/types/api'
import { apiErrorCode, apiErrorMessage } from '~/utils/api/errors'

const api = useApiClient()
const modelTarget = ref<ModelTarget | null>(null)
const harness = ref<ExecutionHarness | null>(null)
const saving = ref(false)
const saveError = ref('')
const selectionError = ref('')
const feedback = ref('')

const { data, status, refresh } = await useAsyncData(
  'workspace-execution-defaults',
  async () => {
    const [defaults, linkedServices] = await Promise.all([
      api.workspaces.getDefaults(),
      api.linkedServices.list(),
    ])
    return { defaults, linkedServices }
  },
)

watch(() => data.value?.defaults, (defaults) => {
  if (!defaults) return
  modelTarget.value = defaults.model_target
  harness.value = defaults.harness
}, { immediate: true })

function updateModelTarget(value: ModelTarget | null) {
  modelTarget.value = value
  selectionError.value = ''
  saveError.value = ''
  feedback.value = ''
}

async function saveDefaults() {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  selectionError.value = ''
  feedback.value = ''
  try {
    const defaults = await api.workspaces.replaceDefaults({
      model_target: modelTarget.value,
      harness: harness.value,
    })
    modelTarget.value = defaults.model_target
    harness.value = defaults.harness
    if (data.value) data.value.defaults = defaults
    feedback.value = 'Workspace execution defaults saved.'
  } catch (cause) {
    if (apiErrorCode(cause) === 'linked_service_selection_unavailable') {
      selectionError.value = 'This connection is no longer able to serve the selected model. Choose another target.'
    } else {
      saveError.value = apiErrorMessage(cause, 'Workspace defaults could not be saved. Please try again.')
    }
  } finally {
    saving.value = false
  }
}

definePageMeta({
  pageTransition: false,
})

useHead({
  title: 'Settings · Looping Louie',
})
</script>

<template>
  <section class="workspace-defaults" aria-labelledby="workspace-defaults-title">
    <header>
      <h2 id="workspace-defaults-title">Execution defaults</h2>
      <p>Set the model and local harness inherited by pipelines that do not define narrower overrides.</p>
    </header>

    <UiAsyncStage
      :status="status"
      loading-label="Loading workspace defaults…"
      error-label="Workspace defaults could not be loaded."
      @retry="refresh"
    >
      <div class="workspace-defaults__form">
        <section aria-labelledby="workspace-model-title">
          <div class="workspace-defaults__heading">
            <h3 id="workspace-model-title">Default model target</h3>
            <p>A target combines one workspace connection with one logical model.</p>
          </div>
          <ExecutionModelTargetSelector
            :model-value="modelTarget"
            :services="data?.linkedServices ?? []"
            inherit-label="No workspace model default"
            inherit-description="Pipelines and activities must then provide a model before their agents can run."
            :error="selectionError"
            :disabled="saving"
            @update:model-value="updateModelTarget"
          />
        </section>

        <section aria-labelledby="workspace-harness-title">
          <div class="workspace-defaults__heading">
            <h3 id="workspace-harness-title">Default harness</h3>
            <p>Select the local execution mechanism inherited by pipelines and activities.</p>
          </div>
          <ExecutionHarnessSelector v-model="harness" inherit-label="Compatibility default" :disabled="saving" />
        </section>

        <div class="workspace-defaults__actions">
          <UiButton :loading="saving" @click="saveDefaults">Save defaults</UiButton>
          <p v-if="saveError" class="workspace-defaults__error" role="alert">{{ saveError }}</p>
          <p v-else class="workspace-defaults__feedback" aria-live="polite">{{ feedback }}</p>
        </div>
      </div>
    </UiAsyncStage>
  </section>
</template>

<style scoped>
.workspace-defaults { display: grid; gap: var(--ll-space-8); }
.workspace-defaults > header, .workspace-defaults__heading { display: grid; gap: var(--ll-space-2); }
.workspace-defaults h2, .workspace-defaults h3, .workspace-defaults p { margin: 0; }
.workspace-defaults h2 { color: var(--ll-color-ink); font: 650 var(--ll-text-xl) / 1.2 var(--ll-font-display); }
.workspace-defaults h3 { color: var(--ll-color-ink); font: 650 var(--ll-text-lg) / 1.2 var(--ll-font-display); }
.workspace-defaults header p, .workspace-defaults__heading p { max-width: 48rem; color: var(--ll-color-text-muted); }
.workspace-defaults__form { display: grid; gap: var(--ll-space-10); }
.workspace-defaults__form > section { display: grid; gap: var(--ll-space-5); padding: var(--ll-space-6); background: var(--ll-color-card); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.workspace-defaults__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ll-space-4); }
.workspace-defaults__error { color: var(--ll-color-brand-ink); }
.workspace-defaults__feedback { color: var(--ll-color-primary-depth); }
</style>
