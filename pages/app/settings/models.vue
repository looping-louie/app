<script setup lang="ts">
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPagination from '~/components/ui/Pagination.vue'
import type { ModelSort, ModelStatus } from '~/types/api'

const api = useApiClient()
const route = useRoute()
const { providerLogo } = useModelLogo()
const modelStatus = ref('all')
const modelLabs = ref<string[]>([])
const modelSort = ref('alphabetical-asc')
const modelOffset = ref(0)
const modelPageSize = 24

const modelQuery = computed(() => ({
  offset: modelOffset.value,
  status: modelStatus.value === 'all' ? undefined : modelStatus.value as ModelStatus,
  include_deprecated: modelStatus.value === 'all',
  lab: modelLabs.value.length ? modelLabs.value : undefined,
  sort: modelSort.value as ModelSort,
}))

const { data, status, refresh } = await useAsyncData(
  'settings-models',
  () => api.models.list(modelQuery.value),
  { watch: [modelQuery] },
)

const models = computed(() => data.value?.items ?? [])
const modelTotal = computed(() => data.value?.total ?? 0)

watch([modelStatus, modelLabs, modelSort], () => {
  modelOffset.value = 0
}, { deep: true })

const modelLabOptions = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deep-cogito', label: 'Deep Cogito' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'google', label: 'Google' },
  { value: 'meta', label: 'Meta' },
  { value: 'minimax', label: 'Minimax' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'moonshot', label: 'Moonshot' },
  { value: 'nvidia', label: 'Nvidia' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'thinking-machines', label: 'Thinking Machines' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'z', label: 'Z' },
]

const modelStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'preview', label: 'Preview' },
  { value: 'deprecated', label: 'Deprecated' },
]

function vendorInitials(vendor: string) {
  return vendor
    .split(/[\s.]+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function focusedModelId() {
  const value = Array.isArray(route.query.model) ? route.query.model[0] : route.query.model
  return typeof value === 'string' ? value : ''
}

async function revealFocusedModel() {
  const modelId = focusedModelId()
  if (!modelId) return
  await nextTick()
  document.getElementById(`model-${modelId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch([models, () => route.query.model], () => void revealFocusedModel(), { immediate: true })

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

    <UiCatalogFilterBar
      v-model:status="modelStatus"
      v-model:category="modelLabs"
      v-model:sort="modelSort"
      interactive
      :show-search="false"
      :status-options="modelStatusOptions"
      third-label="Labs"
      third-icon="labs"
      :third-options="modelLabOptions"
      class="models-filters"
    />

    <UiAsyncStage
      :status="status"
      :empty="models.length === 0"
      loading-label="Loading models…"
      error-label="Models could not be loaded."
      empty-label="No models found."
      @retry="refresh"
    >
      <UiGrid :columns="3" gap="lg">
        <div
          v-for="model in models"
          :id="`model-${model.id}`"
          :key="model.id"
          class="model-item"
          :class="{ 'model-item--focused': focusedModelId() === model.id }"
        >
          <img
            v-if="providerLogo(model.vendor, model.family)"
            class="model-item__logo"
            :src="providerLogo(model.vendor, model.family)"
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
    </UiAsyncStage>

    <UiPagination
      v-if="status === 'success'"
      v-model:offset="modelOffset"
      :total="modelTotal"
      :page-size="modelPageSize"
      aria-label="Models pagination"
    />
  </section>
</template>

<style scoped>
.models-filters {
  margin-bottom: var(--ll-space-10);
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

.model-item--focused {
  background: var(--ll-color-primary-highlight);
  border-color: var(--ll-color-primary);
  box-shadow: 0 0 0 3px var(--ll-color-primary-highlight);
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
