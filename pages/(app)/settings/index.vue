<script setup lang="ts">
import type { Ref, ShallowRef } from 'vue'
import ExecutionHarnessSelector from '~/components/execution/HarnessSelector.vue'
import ExecutionModelTargetSelector from '~/components/execution/ModelTargetSelector.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import type { ExecutionHarness } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

interface SettingsNavigationState {
  dirty: Ref<boolean>
  saving: Ref<boolean>
  save: ShallowRef<(() => Promise<void> | void) | null>
}

const api = useApiClient()
const notifications = useNotifications()
const settingsNavigation = inject<SettingsNavigationState>('settings-navigation')
const defaultModelId = ref<string | null>(null)
const defaultHarness = ref<ExecutionHarness | null>(null)
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
    api.models.list({ available: true, sort: 'alphabetical-asc' }),
  ])
  return { user, models: models.items }
})

const currentSettings = computed(() => JSON.stringify({
  default_model_id: defaultModelId.value,
  default_harness: defaultHarness.value,
}))
const isDirty = computed(() => initialized.value && currentSettings.value !== savedSettings.value)
const errorLabel = computed(() => apiErrorMessage(error.value, 'Execution settings could not be loaded.'))

watch(executionSettings, (value) => {
  if (!value || initialized.value) return
  defaultModelId.value = value.user.settings.default_model_id
  defaultHarness.value = cloneHarness(value.user.settings.default_harness)
  savedSettings.value = currentSettings.value
  initialized.value = true
}, { immediate: true })

function cloneHarness(value: ExecutionHarness | null) {
  return value ? { ...value, config: {} } : null
}

async function saveDefaults() {
  if (!settingsNavigation || settingsNavigation.saving.value) return
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

definePageMeta({ pageTransition: false })
useHead({ title: 'Settings · Looping Louie' })
</script>

<template>
  <UiAsyncStage
    :status="status"
    :error-label="errorLabel"
    :show-retry="true"
    @retry="refresh"
  >
    <div class="global-configuration">
      <section class="configuration-section" aria-labelledby="default-model-title">
        <UiCollectionGroupTitle id="default-model-title" title="Default model" heading-as="h2" />
        <UiSectionStage inverse="bottom">
          <div class="configuration-control">
            <ExecutionModelTargetSelector
              v-model="defaultModelId"
              :models="executionSettings?.models ?? []"
              inherit-label="No default model"
              inherit-description="Louie runs must then configure a model at pipeline, activity, or persona level."
            />
          </div>
        </UiSectionStage>
      </section>

      <section class="configuration-section" aria-labelledby="default-harness-title">
        <UiCollectionGroupTitle id="default-harness-title" title="Default harness" heading-as="h2" />
        <UiSectionStage inverse="bottom">
          <div class="configuration-control">
            <ExecutionHarnessSelector
              v-model="defaultHarness"
              inherit-label="Use compatibility default"
              inherit-description="The API uses Louie v1 when no narrower scope selects a harness."
            />
          </div>
        </UiSectionStage>
      </section>
    </div>
  </UiAsyncStage>
</template>

<style scoped>
.global-configuration { display: grid; gap: var(--ll-space-12); }
.configuration-section { min-width: 0; }
.configuration-section :deep(.ui-section-stage) { --ui-section-stage-shell-inset: 0rem; }
.configuration-control { padding: var(--ll-space-6); }
</style>
