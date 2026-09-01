<script setup lang="ts">
import type { Ref, ShallowRef } from 'vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiToggle from '~/components/ui/Toggle.vue'
import type { ExecutionHarness, ExecutionHarnessKind, ModelAvailabilityStatus, ModelSummary, UserResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { collectApiPages } from '~/utils/apiPagination'
import { executionHarnesses } from '~/utils/executionHarnesses'

interface SettingsNavigationState {
  dirty: Ref<boolean>
  saving: Ref<boolean>
  save: ShallowRef<(() => Promise<void> | void) | null>
}

interface HarnessOption {
  id: string
  name: string
  owner: string
  image: string
  kind?: ExecutionHarnessKind
}

interface ModelPaletteItem {
  id: string
  label: string
  description?: string
  group?: string
  keywords?: string[]
  imageSrc?: string
  imageAlt?: string
}

const harnessOptions: HarnessOption[] = [
  ...executionHarnesses.map(harness => ({
    id: harness.id, name: harness.name, owner: harness.owner, image: harness.image, kind: harness.id,
  })),
  { id: 'pi', name: 'Pi', owner: 'Badlogic', image: '/images/harnesses/pi.webp' },
  { id: 'cursor', name: 'Cursor', owner: 'Anysphere', image: '/images/harnesses/cursor.webp' },
  { id: 'copilot', name: 'Copilot', owner: 'Microsoft', image: '/images/harnesses/copilot.webp' },
  { id: 'claude', name: 'Claude Code', owner: 'Anthropic', image: '/images/harnesses/claude.webp' },
  { id: 'grok-build', name: 'Grok Build', owner: 'xAI', image: '/images/harnesses/grok-build.webp' },
  { id: 'hermes', name: 'Hermes', owner: 'Nous Research', image: '/images/harnesses/hermes.webp' },
  { id: 'openclaw', name: 'OpenClaw', owner: 'OpenClaw', image: '/images/harnesses/openclaw.webp' },
]
const noDefaultModelId = '__no-default-model__'

const api = useApiClient()
const notifications = useNotifications()
const { modelLogo, providerLogo } = useModelLogo()
const settingsNavigation = inject<SettingsNavigationState>('settings-navigation')
const defaultModelId = ref<string | null>(null)
const defaultModelAvailability = ref<ModelAvailabilityStatus>('enabled')
const defaultHarness = ref<ExecutionHarness | null>(null)
const selectedHarnessId = ref('louie')
const modelPaletteOpen = ref(false)
const modelPaletteQuery = ref('')
const savedRemoteSettings = ref('')
const remoteSettingsSaving = ref(false)
const initialized = ref(false)

const {
  data: executionSettings,
  status,
  error,
  refresh,
} = await useAsyncData('user-execution-settings', async () => {
  const [user, models] = await Promise.all([
    api.users.getCurrent(),
    collectApiPages(offset => api.models.list({ offset, sort: 'alphabetical-asc' })),
  ])
  return { user, models }
})

const selectedModel = computed(() => (
  executionSettings.value?.models.find(model => model.id === defaultModelId.value) ?? null
))
const selectedModelLogo = computed(() => selectedModel.value
  ? providerLogo(selectedModel.value.vendor, selectedModel.value.family) || modelLogo(selectedModel.value.id)
  : undefined)
const modelPaletteItems = computed<ModelPaletteItem[]>(() => [
  {
    id: noDefaultModelId,
    label: 'No default model',
    description: 'Require Louie runs to choose a model at a narrower scope.',
    group: 'Default',
    keywords: ['none', 'inherit', 'empty'],
  },
  ...(executionSettings.value?.models ?? []).map(model => modelPaletteItem(model)),
])
const currentRemoteSettings = computed(() => JSON.stringify({
  default_model_id: defaultModelId.value,
  default_model_availability: defaultModelAvailability.value,
  selected_harness_id: selectedHarnessId.value,
}))
const isDirty = computed(() => initialized.value && currentRemoteSettings.value !== savedRemoteSettings.value)
const errorLabel = computed(() => apiErrorMessage(error.value, 'Execution settings could not be loaded.'))

watch(executionSettings, (value) => {
  if (!value || initialized.value) return
  defaultModelId.value = value.user.settings.default_model_id
  defaultModelAvailability.value = value.user.settings.default_model_availability
  defaultHarness.value = cloneHarness(value.user.settings.default_harness)
  selectedHarnessId.value = value.user.settings.default_harness?.kind ?? 'louie'
  savedRemoteSettings.value = currentRemoteSettings.value
  initialized.value = true
}, { immediate: true })

function cloneHarness(value: ExecutionHarness | null) {
  return value ? { ...value, config: {} } : null
}

function modelPaletteItem(model: ModelSummary): ModelPaletteItem {
  return {
    id: model.id,
    label: model.name,
    description: `${model.vendor} · ${model.family}`,
    group: 'Models',
    keywords: [model.id, model.vendor, model.family, ...model.tags],
    imageSrc: providerLogo(model.vendor, model.family) || modelLogo(model.id),
    imageAlt: '',
  }
}

function openModelPalette() {
  modelPaletteQuery.value = ''
  modelPaletteOpen.value = true
}

function syncRemoteSettings(user: UserResponse) {
  defaultModelId.value = user.settings.default_model_id
  defaultModelAvailability.value = user.settings.default_model_availability
  defaultHarness.value = cloneHarness(user.settings.default_harness)
  selectedHarnessId.value = user.settings.default_harness?.kind ?? 'louie'
}

async function persistRemoteSettings(successTitle: string, successDescription: string) {
  if (remoteSettingsSaving.value || settingsNavigation?.saving.value) return false

  remoteSettingsSaving.value = true
  if (settingsNavigation) settingsNavigation.saving.value = true
  try {
    const currentUser = executionSettings.value?.user ?? await api.users.getCurrent()
    const updated = await api.users.replaceSettings({
      ...currentUser.settings,
      default_model_id: defaultModelId.value,
      default_model_availability: defaultModelAvailability.value,
      default_harness: cloneHarness(defaultHarness.value),
    })
    if (executionSettings.value) executionSettings.value = { ...executionSettings.value, user: updated }
    syncRemoteSettings(updated)
    savedRemoteSettings.value = currentRemoteSettings.value
    notifications.success(successTitle, successDescription)
    return true
  } catch (cause) {
    notifications.error(
      'Changes weren’t saved',
      apiErrorMessage(cause, 'Your user settings could not be updated. Please try again.'),
    )
    return false
  } finally {
    remoteSettingsSaving.value = false
    if (settingsNavigation) settingsNavigation.saving.value = false
  }
}

async function selectModel(item: ModelPaletteItem) {
  if (remoteSettingsSaving.value) return
  const previousModelId = defaultModelId.value
  defaultModelId.value = item.id === noDefaultModelId ? null : item.id
  const saved = await persistRemoteSettings(
    'Default model updated',
    defaultModelId.value
      ? `${selectedModel.value?.name ?? defaultModelId.value} is now the default execution model.`
      : 'Executions will require a model from a narrower scope.',
  )
  if (!saved) defaultModelId.value = previousModelId
}

async function updateDefaultModelAvailability(enabled: boolean) {
  if (remoteSettingsSaving.value) return
  const previousAvailability = defaultModelAvailability.value
  defaultModelAvailability.value = enabled ? 'enabled' : 'disabled'
  const saved = await persistRemoteSettings(
    'New model policy updated',
    enabled
      ? 'New models in available provider families will be enabled automatically.'
      : 'New models in available provider families will remain disabled until you enable them.',
  )
  if (!saved) defaultModelAvailability.value = previousAvailability
}

async function selectHarness(harness: HarnessOption) {
  if (remoteSettingsSaving.value) return
  const previousHarnessId = selectedHarnessId.value
  const previousHarness = cloneHarness(defaultHarness.value)
  selectedHarnessId.value = harness.id
  if (!harness.kind) return

  defaultHarness.value = { kind: harness.kind, version: 'v1', config: {} }
  const saved = await persistRemoteSettings(
    'Default harness updated',
    `${harness.name} is now the default execution harness.`,
  )
  if (!saved) {
    selectedHarnessId.value = previousHarnessId
    defaultHarness.value = previousHarness
  }
}

async function saveDefaults() {
  if (!settingsNavigation || settingsNavigation.saving.value || remoteSettingsSaving.value) return
  const selectedHarness = harnessOptions.find(harness => harness.id === selectedHarnessId.value)
  if (!selectedHarness?.kind) {
    notifications.error(
      'Changes weren’t saved',
      `${selectedHarness?.name ?? 'This harness'} is not supported by the API yet. Choose Louie or Codex CLI and try again.`,
    )
    return
  }

  settingsNavigation.saving.value = true
  try {
    const currentUser = executionSettings.value?.user ?? await api.users.getCurrent()
    const updated = await api.users.replaceSettings({
      ...currentUser.settings,
      default_model_id: defaultModelId.value,
      default_model_availability: defaultModelAvailability.value,
      default_harness: cloneHarness(defaultHarness.value),
    })
    if (executionSettings.value) executionSettings.value = { ...executionSettings.value, user: updated }
    syncRemoteSettings(updated)
    savedRemoteSettings.value = currentRemoteSettings.value
    notifications.success('Changes saved', 'Your execution defaults have been updated.')
  } catch (cause) {
    notifications.error(
      'Changes weren’t saved',
      apiErrorMessage(cause, 'Your user settings could not be updated. Please try again.'),
    )
  } finally {
    settingsNavigation.saving.value = false
  }
}

if (settingsNavigation) {
  settingsNavigation.save.value = saveDefaults
  watch(isDirty, dirty => {
    settingsNavigation.dirty.value = dirty
  }, { immediate: true })

  onUnmounted(() => {
    if (settingsNavigation.save.value === saveDefaults) {
      settingsNavigation.dirty.value = false
      settingsNavigation.save.value = null
    }
  })
}

definePageMeta({ pageTransition: false })
useHead({ title: 'Settings · Looping Louie' })
</script>

<template>
  <div v-if="status === 'pending' || status === 'idle'" class="configuration-state" role="status">
    Loading execution settings…
  </div>
  <div v-else-if="status === 'error'" class="configuration-state configuration-state--error" role="alert">
    <span>{{ errorLabel }}</span>
    <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
  </div>
  <div v-else class="global-configuration">
    <section class="configuration-section" aria-labelledby="default-harness-title">
      <UiCollectionGroupTitle id="default-harness-title" title="Default harness" heading-as="h2" />
      <UiSectionStage inverse="bottom">
        <UiGrid :columns="4" gap="md" class="harness-grid" role="radiogroup" aria-label="Default harness">
          <UiPill
            v-for="harness in harnessOptions"
            :key="harness.id"
            :class="{ 'harness-pill--louie': harness.id === 'louie' }"
            variant="selectable"
            icon-style="circle"
            :src="harness.image"
            alt=""
            :description="harness.owner"
            :selected="selectedHarnessId === harness.id"
            :aria-label="`Use ${harness.name} by ${harness.owner} as the default harness`"
            @click="void selectHarness(harness)"
          >
            {{ harness.name }}
          </UiPill>
        </UiGrid>
      </UiSectionStage>
    </section>

    <section class="configuration-section" aria-labelledby="execution-defaults-title">
      <UiCollectionGroupTitle id="execution-defaults-title" title="Execution defaults" heading-as="h2" />
      <UiSectionStage inverse="both">
        <div class="execution-defaults">
          <div class="execution-defaults__row">
            <div class="execution-defaults__copy"><h3>Default model</h3><p>Used when an execution does not provide a model override.</p></div>
            <UiPill
              class="execution-defaults__model-pill"
              variant="catalog"
              :empty="!selectedModel"
              :src="selectedModelLogo"
              alt=""
              clickable
              aria-haspopup="dialog"
              :aria-label="selectedModel ? `Change default model, currently ${selectedModel.name}` : 'Choose a default execution model'"
              :description="selectedModel ? `${selectedModel.vendor} · ${selectedModel.family}` : 'Click to choose a default execution model'"
              @click="openModelPalette"
            >
              {{ selectedModel?.name ?? 'No model has been selected' }}
            </UiPill>
          </div>
          <div class="execution-defaults__row">
            <div class="execution-defaults__copy"><h3>Enable new models by default</h3><p>Automatically enable newly released models from provider families you already have available.</p></div>
            <UiToggle
              class="execution-defaults__model-policy-toggle"
              :model-value="defaultModelAvailability === 'enabled'"
              :disabled="remoteSettingsSaving"
              aria-label="Enable new models by default"
              @update:model-value="void updateDefaultModelAvailability($event)"
            />
          </div>
        </div>
      </UiSectionStage>
    </section>
  </div>

  <UiCommandPalette
    v-model:open="modelPaletteOpen"
    v-model:query="modelPaletteQuery"
    :items="modelPaletteItems"
    placeholder="Search models…"
    aria-label="Choose default model"
    empty-title="No models found"
    empty-description="Try another model, vendor, or family."
    option-style="card"
    size="wide"
    :keyboard-shortcut="false"
    @select="void selectModel($event)"
  />
</template>

<style scoped>
.global-configuration { display: grid; gap: var(--ll-space-12); }
.configuration-state { display: flex; min-height: 10rem; align-items: center; justify-content: center; gap: var(--ll-space-4); color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
.configuration-state--error { color: var(--ll-color-brand-ink); }
.configuration-section { min-width: 0; }
.configuration-section :deep(.ui-section-stage) { --ui-section-stage-shell-inset: 0rem; }
.harness-grid { padding: var(--ll-space-2); }
.harness-pill--louie :deep(.ui-icon-pill__media--image) { background: transparent; }
.harness-pill--louie :deep(.ui-icon-pill__media--image img) { width: 72%; height: 72%; object-fit: contain; }
.execution-defaults { display: grid; padding: var(--ll-space-2); }
.execution-defaults__row { display: grid; min-width: 0; min-height: 5.5rem; box-sizing: border-box; grid-template-columns: minmax(14rem, 1fr) minmax(16rem, 0.7fr); align-items: center; gap: var(--ll-space-8); padding: var(--ll-space-4) var(--ll-space-5); border-bottom: 1px solid var(--ll-color-divider); }
.execution-defaults__row:last-child { border-bottom: 0; }
.execution-defaults__model-pill { width: 100%; max-width: 32rem; justify-self: end; }
.execution-defaults__model-policy-toggle { justify-self: end; }
.execution-defaults__copy { display: grid; min-width: 0; gap: var(--ll-space-1); }
.execution-defaults__copy h3, .execution-defaults__copy p { margin: 0; }
.execution-defaults__copy h3 { color: var(--ll-color-ink); font: 600 var(--ll-text-md) / 1.25 var(--ll-font-control); }
.execution-defaults__copy p { color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
@media (max-width: 44rem) {
  .execution-defaults__row { grid-template-columns: minmax(0, 1fr) auto; gap: var(--ll-space-3) var(--ll-space-5); padding-inline: var(--ll-space-3); }
  .execution-defaults__model-pill { grid-column: 1 / -1; max-width: none; }
}
</style>
