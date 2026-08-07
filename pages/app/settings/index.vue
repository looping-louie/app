<script setup lang="ts">
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import UiToggle from '~/components/ui/Toggle.vue'

type SettingsSection = 'global' | 'providers' | 'models'

interface ProviderResponse {
  provider: string
  name: string
  description: string
  enabled: boolean
}

interface ModelSummaryResponse {
  id: string
  name: string
  vendor: string
  family: string
}

interface ModelListResponse {
  items: ModelSummaryResponse[]
  total: number
}

interface ProviderListItem {
  [key: string]: string | undefined
  id: string
  to: string
  name: string
  description: string
  enabledState: 'true' | 'false'
}

const section = ref<SettingsSection>('global')

watch(section, (nextSection) => {
  if (nextSection === 'providers') {
    navigateTo('/app/settings/providers')
  }
})

const sectionOptions = [
  { value: 'global', label: 'Global configuration' },
  { value: 'providers', label: 'Providers' },
  { value: 'models', label: 'Models' },
]

const { data: catalog, status, error, refresh } = await useAsyncData(
  'settings-catalog',
  async () => {
    const [providers, models] = await Promise.all([
      $fetch<ProviderResponse[]>('/api/v1/providers'),
      $fetch<ModelListResponse>('/api/v1/models'),
    ])

    return { providers, models: models.items }
  },
)

const providerItems = computed<ProviderListItem[]>(() => (
  (catalog.value?.providers ?? []).map(provider => ({
    id: provider.provider,
    to: `/settings/providers/${encodeURIComponent(provider.provider)}`,
    name: provider.name,
    description: provider.description,
    enabledState: provider.enabled ? 'true' : 'false',
  }))
))

const models = computed(() => catalog.value?.models ?? [])

const modelLogoByVendor: Record<string, string> = {
  anthropic: '/images/models/anthropic.webp',
  deepseek: '/images/models/deepseek.webp',
  meta: '/images/models/meta.webp',
  minimax: '/images/models/minimax.webp',
  'moonshot ai': '/images/models/kimi.webp',
  openai: '/images/models/openai.webp',
  qwen: '/images/models/qwen.webp',
  'x.ai': '/images/models/grok.webp',
}

function modelLogo(model: ModelSummaryResponse) {
  if (model.vendor === 'Google') {
    return model.family.toLowerCase().startsWith('gemma')
      ? '/images/models/gemma.webp'
      : '/images/models/gemini.webp'
  }

  return modelLogoByVendor[model.vendor.toLowerCase()]
}

function vendorInitials(vendor: string) {
  return vendor
    .split(/[\s.]+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Settings · Looping Louie',
})
</script>

<template>
  <UiContainer size="wide" class="settings-page">
    <header class="settings-header">
      <h1>Settings</h1>
      <UiSegmentedControl
        v-model="section"
        :options="sectionOptions"
        variant="inline"
        accent="metal"
        aria-label="Settings section"
      />
    </header>

    <div v-if="section === 'global'" class="settings-panel" aria-label="Global configuration" />

    <section v-else-if="section === 'providers'" class="settings-panel" aria-labelledby="providers-heading">
      <h2 id="providers-heading" class="visually-hidden">Providers</h2>

      <div v-if="status === 'pending'" class="settings-state" role="status">Loading providers…</div>
      <div v-else-if="error" class="settings-state settings-state--error" role="alert">
        <span>Providers could not be loaded.</span>
        <button type="button" @click="refresh">Retry</button>
      </div>
      <UiSectionStage v-else inverse="both" class="settings-stage">
        <UiGridList :items="providerItems" variant="plain" aria-label="Providers" clickable>
          <template #leading="{ item }">
            <strong>{{ item.name }}</strong>
          </template>
          <template #metadata="{ item }">
            {{ item.description }}
          </template>
          <template #trailing="{ item }">
            <UiToggle
              :model-value="item.enabledState === 'true'"
              readonly
              :aria-label="`${item.name} is ${item.enabledState === 'true' ? 'enabled' : 'disabled'}`"
            />
          </template>
        </UiGridList>
      </UiSectionStage>
    </section>

    <section v-else class="settings-panel" aria-labelledby="models-heading">
      <h2 id="models-heading" class="visually-hidden">Models</h2>

      <div v-if="status === 'pending'" class="settings-state" role="status">Loading models…</div>
      <div v-else-if="error" class="settings-state settings-state--error" role="alert">
        <span>Models could not be loaded.</span>
        <button type="button" @click="refresh">Retry</button>
      </div>
      <UiSectionStage v-else inverse="both" class="settings-stage">
        <UiGrid :columns="3" gap="lg" class="models-grid">
          <div v-for="model in models" :key="model.id" class="model-item">
            <img
              v-if="modelLogo(model)"
              class="model-item__logo"
              :src="modelLogo(model)"
              :alt="`${model.vendor} logo`"
              width="44"
              height="44"
              loading="lazy"
            >
            <span v-else class="model-item__fallback" aria-hidden="true">
              {{ vendorInitials(model.vendor) }}
            </span>
            <div class="model-item__copy">
              <strong>{{ model.vendor }}</strong>
              <span>{{ model.name }}</span>
            </div>
          </div>
        </UiGrid>
      </UiSectionStage>
    </section>
  </UiContainer>
</template>

<style scoped>
.settings-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.settings-header {
  display: grid;
  gap: var(--ll-space-8);
}

.settings-header h1 {
  margin: 0;
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 620;
  line-height: 1.03;
  letter-spacing: -0.045em;
}

.settings-panel {
  margin-top: var(--ll-space-10);
}

.settings-stage {
  width: 100%;
}

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

.settings-state button {
  padding: var(--ll-space-2) var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  cursor: pointer;
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-control);
}

.models-grid {
  margin-top: 0;
}

.model-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ll-radius-structural);
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.model-item:hover {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.model-item__logo,
.model-item__fallback {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  place-items: center;
  box-sizing: border-box;
  object-fit: cover;
  color: #ffffff;
  background: var(--ll-color-metal-950);
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--ll-color-border);
}

.model-item__fallback {
  font: 600 0.6875rem / 1 var(--ll-font-mono);
}

.model-item__copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.model-item__copy strong,
.model-item__copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-item__copy strong {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
}

.model-item__copy span {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
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

@media (max-width: 38rem) {
  .settings-page {
    padding-block-start: var(--ll-space-8);
  }

  .settings-header {
    gap: var(--ll-space-6);
  }

  .settings-header :deep(.ui-segmented-control--inline) {
    width: 100%;
    overflow-x: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .model-item {
    transition: none;
  }
}
</style>
