<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import { useProviders } from '~/composables/useProviders'

interface ProviderListItem {
  [key: string]: unknown
  id: string
  name: string
  description: string
  checked: boolean
  disabled: boolean
  actionLabel: string
  ariaLabel: string
}

const { providers, pending, error, fetchProviders, setEnabled } = useProviders()
const togglingId = ref<string | null>(null)
const feedback = ref('')

await useAsyncData('settings-providers', () => fetchProviders())

const providerItems = computed<ProviderListItem[]>(() => (
  providers.value.map(provider => ({
    id: provider.id,
    name: provider.name,
    description: provider.description,
    checked: provider.enabled,
    disabled: togglingId.value === provider.id,
    actionLabel: provider.enabled ? 'Disable' : 'Enable',
    ariaLabel: `${provider.enabled ? 'Disable' : 'Enable'} ${provider.name}`,
  }))
))

async function updateProvider(item: { id: string }, enabled: boolean) {
  if (togglingId.value) return

  const provider = providers.value.find(candidate => candidate.id === item.id)
  if (!provider) return

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
    <UiSectionStage v-else inverse="both">
      <UiGridList
        :items="providerItems"
        variant="plain"
        action="toggle"
        aria-label="Providers"
        @toggle="updateProvider"
      >
        <template #leading="{ item }"><strong>{{ item.name }}</strong></template>
        <template #metadata="{ item }">{{ item.description }}</template>
      </UiGridList>
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
