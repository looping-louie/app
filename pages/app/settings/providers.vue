<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import ProviderAccordion from '~/components/settings/ProviderAccordion.vue'
import type { Provider } from '~/composables/useProviders'
import { useProviders } from '~/composables/useProviders'

const { providers, pending, error, fetchProviders, saveCredential, setEnabled } = useProviders()
const togglingId = ref<string | null>(null)
const savingId = ref<string | null>(null)
const feedback = ref('')

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
    provider.keyTrimmed = result.key_trimmed
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

    <div v-if="pending" class="settings-state" role="status">Loading providers…</div>
    <div v-else-if="error" class="settings-state settings-state--error" role="alert">
      <span>{{ error }}</span>
      <UiButton variant="stroke" size="sm" @click="fetchProviders">Retry</UiButton>
    </div>
    <UiSectionStage v-else inverse="bottom">
      <ProviderAccordion
        :providers="providers"
        :toggling-id="togglingId"
        :saving-id="savingId"
        aria-label="Providers"
        @toggle="updateProvider"
        @save="saveProviderKey"
      />
    </UiSectionStage>

    <p class="settings-feedback" aria-live="polite">{{ feedback }}</p>
  </section>
</template>

<style scoped>
.settings-state {
  display: flex;
  min-height: 10rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ll-radius-structural);
  font-size: var(--ll-text-sm);
}

.settings-state--error {
  color: var(--ll-color-brand-ink);
}

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
