<script setup lang="ts">
import type { Ref, ShallowRef } from 'vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import UiToggle from '~/components/ui/Toggle.vue'
import type { ExecutionHarness, ExecutionHarnessKind, ModelSummary } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { collectApiPages } from '~/utils/apiPagination'

interface SettingsNavigationState {
  dirty: Ref<boolean>
  saving: Ref<boolean>
  save: ShallowRef<(() => Promise<void> | void) | null>
}

interface ExecutionPreferences {
  defaultBranch: string
  protectedBranches: string
  allowCommits: boolean
  allowPullRequests: boolean
  createRunBranches: boolean
  requireMergeApproval: boolean
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

const initialPreferences: ExecutionPreferences = {
  defaultBranch: 'main',
  protectedBranches: 'main, master',
  allowCommits: true,
  allowPullRequests: true,
  createRunBranches: true,
  requireMergeApproval: false,
}
const harnessOptions: HarnessOption[] = [
  { id: 'louie', name: 'Louie', owner: 'Looping Louie', image: '/brand/looping-louie-biplane.png', kind: 'louie' },
  { id: 'codex_cli', name: 'Codex CLI', owner: 'OpenAI', image: '/images/harnesses/codex.webp', kind: 'codex_cli' },
  { id: 'pi', name: 'Pi', owner: 'Badlogic', image: '/images/harnesses/pi.webp' },
  { id: 'cursor', name: 'Cursor', owner: 'Anysphere', image: '/images/harnesses/cursor.webp' },
  { id: 'copilot', name: 'Copilot', owner: 'Microsoft', image: '/images/harnesses/copilot.webp' },
  { id: 'claude', name: 'Claude Code', owner: 'Anthropic', image: '/images/harnesses/claude.webp' },
  { id: 'grok-build', name: 'Grok Build', owner: 'xAI', image: '/images/harnesses/grok-build.webp' },
  { id: 'hermes', name: 'Hermes', owner: 'Nous Research', image: '/images/harnesses/hermes.webp' },
  { id: 'openclaw', name: 'OpenClaw', owner: 'OpenClaw', image: '/images/harnesses/openclaw.webp' },
]
const localPreferencesKey = 'looping-louie:execution-preferences:v1'
const noDefaultModelId = '__no-default-model__'

const api = useApiClient()
const notifications = useNotifications()
const { modelLogo, providerLogo } = useModelLogo()
const settingsNavigation = inject<SettingsNavigationState>('settings-navigation')
const defaultModelId = ref<string | null>(null)
const defaultHarness = ref<ExecutionHarness | null>(null)
const selectedHarnessId = ref('louie')
const preferences = reactive<ExecutionPreferences>({ ...initialPreferences })
const modelPaletteOpen = ref(false)
const modelPaletteQuery = ref('')
const savedSettings = ref('')
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
const currentSettings = computed(() => JSON.stringify({
  default_model_id: defaultModelId.value,
  selected_harness_id: selectedHarnessId.value,
  preferences,
}))
const isDirty = computed(() => initialized.value && currentSettings.value !== savedSettings.value)
const errorLabel = computed(() => apiErrorMessage(error.value, 'Execution settings could not be loaded.'))

watch(executionSettings, (value) => {
  if (!value || initialized.value) return
  defaultModelId.value = value.user.settings.default_model_id
  defaultHarness.value = cloneHarness(value.user.settings.default_harness)
  selectedHarnessId.value = value.user.settings.default_harness?.kind ?? 'louie'
  savedSettings.value = currentSettings.value
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

function selectModel(item: ModelPaletteItem) {
  defaultModelId.value = item.id === noDefaultModelId ? null : item.id
}

function selectHarness(harness: HarnessOption) {
  selectedHarnessId.value = harness.id
  if (harness.kind) defaultHarness.value = { kind: harness.kind, version: 'v1', config: {} }
}

function restoreLocalPreferences() {
  const raw = localStorage.getItem(localPreferencesKey)
  if (!raw) return
  try {
    const saved = JSON.parse(raw) as Partial<ExecutionPreferences>
    if (typeof saved.defaultBranch === 'string') preferences.defaultBranch = saved.defaultBranch
    if (typeof saved.protectedBranches === 'string') preferences.protectedBranches = saved.protectedBranches
    if (typeof saved.allowCommits === 'boolean') preferences.allowCommits = saved.allowCommits
    if (typeof saved.allowPullRequests === 'boolean') preferences.allowPullRequests = saved.allowPullRequests
    if (typeof saved.createRunBranches === 'boolean') preferences.createRunBranches = saved.createRunBranches
    if (typeof saved.requireMergeApproval === 'boolean') preferences.requireMergeApproval = saved.requireMergeApproval
    savedSettings.value = currentSettings.value
  } catch {
    localStorage.removeItem(localPreferencesKey)
  }
}

async function saveDefaults() {
  if (!settingsNavigation || settingsNavigation.saving.value) return
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
      default_harness: cloneHarness(defaultHarness.value),
    })
    if (executionSettings.value) executionSettings.value = { ...executionSettings.value, user: updated }
    defaultModelId.value = updated.settings.default_model_id
    defaultHarness.value = cloneHarness(updated.settings.default_harness)
    if (import.meta.client) localStorage.setItem(localPreferencesKey, JSON.stringify(preferences))
    savedSettings.value = currentSettings.value
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

onMounted(restoreLocalPreferences)

definePageMeta({ pageTransition: false })
useHead({ title: 'Settings · Looping Louie' })
</script>

<template>
  <UiAsyncStage :status="status" :error-label="errorLabel" :show-retry="true" @retry="refresh">
    <div class="global-configuration">
      <section class="configuration-section" aria-labelledby="default-model-title">
        <UiCollectionGroupTitle id="default-model-title" title="Default model" heading-as="h2" />
        <UiSectionStage inverse="bottom">
          <div class="default-model-control">
            <UiPill
              class="default-model-pill"
              :class="{ 'default-model-pill--empty': !selectedModel }"
              :src="selectedModelLogo"
              alt=""
              clickable
              aria-haspopup="dialog"
              :aria-label="selectedModel ? `Change default model, currently ${selectedModel.name}` : 'Choose a default model'"
              @click="openModelPalette"
            >
              <template v-if="!selectedModel" #icon>
                <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40Zm0,160H48V56H208ZM80,96A16,16,0,1,1,96,112,16,16,0,0,1,80,96Zm96,0a16,16,0,1,1,16,16A16,16,0,0,1,176,96ZM80,160a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,160Z" />
                </svg>
              </template>
              {{ selectedModel?.name ?? 'No default model' }}
            </UiPill>
            <p>{{ selectedModel ? `${selectedModel.vendor} · ${selectedModel.family}` : 'Choose the model inherited by Louie runs without a narrower override.' }}</p>
          </div>
        </UiSectionStage>
      </section>

      <section class="configuration-section" aria-labelledby="default-harness-title">
        <UiCollectionGroupTitle id="default-harness-title" title="Default harness" heading-as="h2" />
        <UiSectionStage inverse="bottom">
          <UiGrid :columns="4" gap="md" class="harness-grid" role="radiogroup" aria-label="Default harness">
            <UiPill
              v-for="harness in harnessOptions"
              :key="harness.id"
              variant="selectable"
              icon-style="circle"
              :src="harness.image"
              alt=""
              :description="harness.owner"
              :selected="selectedHarnessId === harness.id"
              :aria-label="`Use ${harness.name} by ${harness.owner} as the default harness`"
              @click="selectHarness(harness)"
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
              <div class="execution-defaults__copy"><h3>Default branch</h3><p>The branch new runs use when no branch is specified.</p></div>
              <UiTextField v-model="preferences.defaultBranch" label="Default branch" hide-label placeholder="main" autocomplete="off" />
            </div>
            <div class="execution-defaults__row">
              <div class="execution-defaults__copy"><h3>Protected branches</h3><p>Comma-separated branches that harnesses must not commit to directly.</p></div>
              <UiTextField v-model="preferences.protectedBranches" label="Protected branches" hide-label placeholder="main, master" autocomplete="off" />
            </div>
            <div class="execution-defaults__toggle-grid">
              <div class="execution-defaults__toggle-option">
                <div class="execution-defaults__copy"><h3>Allow commits</h3><p>Let harnesses create commits after an approved execution.</p></div>
                <UiToggle v-model="preferences.allowCommits" aria-label="Allow commits" />
              </div>
              <div class="execution-defaults__toggle-option">
                <div class="execution-defaults__copy"><h3>Allow pull requests</h3><p>Let harnesses open pull requests with their completed changes.</p></div>
                <UiToggle v-model="preferences.allowPullRequests" aria-label="Allow pull requests" />
              </div>
              <div class="execution-defaults__toggle-option">
                <div class="execution-defaults__copy"><h3>Create a branch for every run</h3><p>Keep each execution isolated from the default branch.</p></div>
                <UiToggle v-model="preferences.createRunBranches" aria-label="Create a branch for every run" />
              </div>
              <div class="execution-defaults__toggle-option">
                <div class="execution-defaults__copy"><h3>Require approval before merge</h3><p>Hold completed pull requests until a reviewer approves them.</p></div>
                <UiToggle v-model="preferences.requireMergeApproval" aria-label="Require approval before merge" />
              </div>
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
      @select="selectModel"
    />
  </UiAsyncStage>
</template>

<style scoped>
.global-configuration { display: grid; gap: var(--ll-space-12); }
.configuration-section { min-width: 0; }
.configuration-section :deep(.ui-section-stage) { --ui-section-stage-shell-inset: 0rem; }
.default-model-control { display: flex; min-height: 5rem; align-items: center; gap: var(--ll-space-4); padding: var(--ll-space-4) var(--ll-space-5); }
.default-model-control > p { margin: 0; color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
.default-model-pill { --ui-icon-pill-height: 2.75rem; flex: 0 0 auto; }
.default-model-pill--empty :deep(.ui-icon-pill__trigger) { color: var(--ll-color-text-muted); border-style: dashed; }
.harness-grid { padding: var(--ll-space-2); }
.execution-defaults { display: grid; padding: var(--ll-space-2); }
.execution-defaults__row { display: grid; min-width: 0; min-height: 5.5rem; box-sizing: border-box; grid-template-columns: minmax(14rem, 1fr) minmax(16rem, 0.7fr); align-items: center; gap: var(--ll-space-8); padding: var(--ll-space-4) var(--ll-space-5); border-bottom: 1px solid var(--ll-color-divider); }
.execution-defaults__row:last-child { border-bottom: 0; }
.execution-defaults__toggle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.execution-defaults__toggle-option { display: grid; min-width: 0; min-height: 6.5rem; box-sizing: border-box; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--ll-space-5); padding: var(--ll-space-4) var(--ll-space-5); }
.execution-defaults__toggle-option:nth-child(even) { border-left: 1px solid var(--ll-color-divider); }
.execution-defaults__toggle-option:nth-child(-n + 2) { border-bottom: 1px solid var(--ll-color-divider); }
.execution-defaults__copy { display: grid; min-width: 0; gap: var(--ll-space-1); }
.execution-defaults__copy h3, .execution-defaults__copy p { margin: 0; }
.execution-defaults__copy h3 { color: var(--ll-color-ink); font: 600 var(--ll-text-md) / 1.25 var(--ll-font-control); }
.execution-defaults__copy p { color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
@media (min-width: 44.0625rem) {
  .execution-defaults__toggle-option:nth-child(odd) { padding-right: calc(var(--ui-section-stage-shell-padding) + var(--ll-space-2) + var(--ll-space-5)); }
  .execution-defaults__toggle-option:nth-child(even) { padding-left: calc(var(--ui-section-stage-shell-padding) + var(--ll-space-2) + var(--ll-space-5)); }
}
@media (max-width: 44rem) {
  .default-model-control { align-items: flex-start; flex-direction: column; }
  .execution-defaults__row { grid-template-columns: minmax(0, 1fr) auto; gap: var(--ll-space-3) var(--ll-space-5); padding-inline: var(--ll-space-3); }
  .execution-defaults__row > :deep(.ui-text-field) { grid-column: 1 / -1; }
  .execution-defaults__toggle-grid { grid-template-columns: minmax(0, 1fr); }
  .execution-defaults__toggle-option { min-height: 5.5rem; padding-inline: var(--ll-space-3); border-bottom: 1px solid var(--ll-color-divider); }
  .execution-defaults__toggle-option:nth-child(even) { border-left: 0; }
  .execution-defaults__toggle-option:last-child { border-bottom: 0; }
}
</style>
