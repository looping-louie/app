<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'

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

const { data, status, error, refresh } = await useAsyncData(
  'settings-models',
  () => $fetch<ModelListResponse>('/api/v1/models'),
)

const models = computed(() => data.value?.items ?? [])

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
  pageTransition: false,
})

useHead({
  title: 'Models · Settings · Looping Louie',
})
</script>

<template>
  <section aria-labelledby="models-heading">
    <h2 id="models-heading" class="visually-hidden">Models</h2>

    <div v-if="status === 'pending'" class="settings-state" role="status">Loading models…</div>
    <div v-else-if="error" class="settings-state settings-state--error" role="alert">
      <span>Models could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="refresh">Retry</UiButton>
    </div>
    <UiSectionStage v-else inverse="both">
      <UiGrid :columns="3" gap="lg">
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

@media (prefers-reduced-motion: reduce) {
  .model-item {
    transition: none;
  }
}
</style>
