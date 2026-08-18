<script setup lang="ts">
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import ProviderAccordion from '~/components/settings/ProviderAccordion.vue'
import type { Provider } from '~/composables/useProviders'
import { useProviders } from '~/composables/useProviders'

const { providers, pending, error, fetchProviders, saveCredential, setEnabled } = useProviders()
const togglingId = ref<string | null>(null)
const savingId = ref<string | null>(null)
const feedback = ref('')
const providerStageStatus = computed<'pending' | 'error' | 'success'>(() => {
  if (pending.value) return 'pending'
  if (error.value) return 'error'
  return 'success'
})

await useAsyncData('settings-providers', () => fetchProviders())

async function updateProvider(provider: Provider, enabled: boolean) {
  if (togglingId.value) return

  const previousValue = provider.enabled
  provider.enabled = enabled
  togglingId.value = provider.id
  feedback.value = ''

  try {
    const result = await setEnabled(provider.id, enabled)
    provider.enabled = result.enabled
    feedback.value = `${provider.name} ${result.enabled ? 'enabled' : 'disabled'}.`
  } catch (cause) {
    provider.enabled = previousValue
    feedback.value = cause instanceof Error
      ? cause.message
      : `Unable to update ${provider.name}.`
  } finally {
    togglingId.value = null
  }
}

async function saveProviderKey(provider: Provider, apiKey: string) {
  if (savingId.value) return

  savingId.value = provider.id
  feedback.value = ''

  try {
    const result = await saveCredential(provider.id, { api_key: apiKey })
    provider.keyTrimmed = result.key_trimmed ?? undefined
    provider.modelCount = result.model_count
    feedback.value = `${provider.name} API key saved.`
  } catch (cause) {
    feedback.value = cause instanceof Error
      ? cause.message
      : `Unable to save the ${provider.name} API key.`
  } finally {
    savingId.value = null
  }
}

definePageMeta({
  pageTransition: false,
})

useHead({
  title: 'Providers · Settings · Looping Louie',
})
</script>

<template>
  <section aria-labelledby="providers-heading">
    <h2 id="providers-heading" class="visually-hidden">Providers</h2>

    <UiAsyncStage
      :status="providerStageStatus"
      :empty="providers.length === 0"
      loading-label="Loading providers…"
      :error-label="error || 'Providers could not be loaded.'"
      empty-label="No providers found."
      @retry="fetchProviders"
    >
      <ProviderAccordion
        :providers="providers"
        :toggling-id="togglingId"
        :saving-id="savingId"
        aria-label="Providers"
        @toggle="updateProvider"
        @save="saveProviderKey"
      />
    </UiAsyncStage>

    <p class="settings-feedback" aria-live="polite">{{ feedback }}</p>
  </section>
</template>

<style scoped>
.settings-feedback {
  min-height: 1.5rem;
  margin: var(--ll-space-4) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
