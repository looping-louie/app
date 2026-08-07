<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiContainer from '~/components/ui/Container.vue'
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
  layout: 'app',
})

useHead({
  title: 'Providers · Settings · Looping Louie',
})
</script>

<template>
  <UiContainer size="wide" class="providers-page">
    <header class="providers-header">
      <div>
        <NuxtLink to="/app/settings" class="providers-back">Settings</NuxtLink>
        <h1>Providers</h1>
        <p>Enable the model providers available to agents and pipelines.</p>
      </div>
    </header>

    <div v-if="pending" class="providers-state" role="status">Loading providers…</div>
    <div v-else-if="error" class="providers-state providers-state--error" role="alert">
      <span>{{ error }}</span>
      <UiButton variant="stroke" size="sm" @click="fetchProviders">Retry</UiButton>
    </div>
    <UiSectionStage v-else inverse="both" class="providers-stage">
      <UiGridList
        :items="providerItems"
        variant="plain"
        action="toggle"
        aria-label="Providers"
        @toggle="updateProvider"
      >
        <template #leading="{ item }">
          <strong>{{ item.name }}</strong>
        </template>
        <template #metadata="{ item }">
          {{ item.description }}
        </template>
      </UiGridList>
    </UiSectionStage>

    <p class="providers-feedback" aria-live="polite">{{ feedback }}</p>
  </UiContainer>
</template>

<style scoped>
.providers-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.providers-header {
  margin-bottom: var(--ll-space-10);
}

.providers-back {
  display: inline-flex;
  margin-bottom: var(--ll-space-3);
  color: var(--ll-color-primary-depth);
  font-size: var(--ll-text-sm);
  font-weight: 600;
  text-decoration: none;
}

.providers-back::before {
  content: '←';
  margin-right: var(--ll-space-2);
}

.providers-back:hover {
  color: var(--ll-color-primary);
}

.providers-header h1 {
  margin: 0;
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 620;
  line-height: 1.03;
  letter-spacing: -0.045em;
}

.providers-header p {
  max-width: 42rem;
  margin: var(--ll-space-3) 0 0;
  color: var(--ll-color-text-muted);
  line-height: 1.6;
}

.providers-state {
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

.providers-state--error {
  color: var(--ll-color-brand-ink);
}

.providers-feedback {
  min-height: 1.5rem;
  margin: var(--ll-space-4) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}
</style>
