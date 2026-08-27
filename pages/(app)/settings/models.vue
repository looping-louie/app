<script setup lang="ts">
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPagination from '~/components/ui/Pagination.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { ModelSort, ModelStatus, ModelSummary } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

const api = useApiClient()
const route = useRoute()
const router = useRouter()
const { providerLogo } = useModelLogo()
const { searchQuery: modelSearchQuery, searchTerm: modelSearchTerm } = useCatalogSearch()
const modelStatus = ref('all')
const modelLabs = ref<string[]>([])
const modelSort = ref('alphabetical-asc')
const modelOffset = ref(0)
const modelPageSize = 24
const policyMutatingId = ref<string | null>(null)
const policyError = ref('')
const arrowSquareOutIconPath = 'M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z'

const officialModelPages: Record<string, string> = {
  anthropic: 'https://docs.anthropic.com/en/docs/about-claude/models/overview',
  'deep-cogito': 'https://www.deepcogito.com/research',
  deepcogito: 'https://www.deepcogito.com/research',
  deepseek: 'https://api-docs.deepseek.com/quick_start/pricing',
  'deepseek-ai': 'https://api-docs.deepseek.com/quick_start/pricing',
  google: 'https://ai.google.dev/gemini-api/docs/models',
  'google-deepmind': 'https://ai.google.dev/gemini-api/docs/models',
  meta: 'https://www.llama.com/models/',
  'meta-ai': 'https://www.llama.com/models/',
  minimax: 'https://platform.minimax.io/docs/api-reference/models/openai/list-models',
  mistral: 'https://docs.mistral.ai/models',
  'mistral-ai': 'https://docs.mistral.ai/models',
  moonshot: 'https://platform.moonshot.ai/docs/guide/start-using-kimi-api',
  'moonshot-ai': 'https://platform.moonshot.ai/docs/guide/start-using-kimi-api',
  nvidia: 'https://build.nvidia.com/models',
  openai: 'https://platform.openai.com/docs/models',
  qwen: 'https://qwen.readthedocs.io/en/stable/',
  'thinking-machines': 'https://thinkingmachines.ai/',
  'thinking-machines-lab': 'https://thinkingmachines.ai/',
  z: 'https://docs.z.ai/guides/overview/models',
  'z-ai': 'https://docs.z.ai/guides/overview/models',
}

const modelQuery = computed(() => ({
  offset: modelOffset.value,
  status: modelStatus.value === 'all' ? undefined : modelStatus.value as ModelStatus,
  include_deprecated: modelStatus.value === 'all',
  lab: modelLabs.value.length ? modelLabs.value : undefined,
  sort: modelSort.value as ModelSort,
  search: modelSearchTerm.value || undefined,
}))

const { data, status, refresh } = await useAsyncData(
  'settings-models',
  () => api.models.list(modelQuery.value),
  { watch: [modelQuery] },
)
const { data: user } = await useAsyncData('settings-model-policy', () => api.users.getCurrent())

const models = computed(() => data.value?.items ?? [])
const modelTotal = computed(() => data.value?.total ?? 0)
const modelSearchItems = computed(() => models.value.map(model => ({
  id: model.id,
  label: model.name,
  description: `${model.vendor} · ${model.family}`,
  group: 'Models',
  keywords: [model.vendor, model.family, ...model.tags],
  imageSrc: providerLogo(model.vendor, model.family) || undefined,
  imageAlt: '',
})))
const defaultAvailability = computed({
  get: () => user.value?.settings.default_model_availability ?? 'enabled',
  set: value => void updateDefaultAvailability(value),
})
const defaultAvailabilityOptions = [
  { value: 'enabled', label: 'Enabled by default' },
  { value: 'disabled', label: 'Disabled by default' },
]

watch([modelStatus, modelLabs, modelSort, modelSearchTerm], () => {
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

function officialModelPage(model: ModelSummary) {
  const vendorKey = model.vendor.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const familyKey = model.family.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return officialModelPages[vendorKey] ?? officialModelPages[familyKey] ?? 'https://build.nvidia.com/models'
}

function modelPolicyEnabled(modelId: string) {
  const configured = user.value?.settings.configured_models.find(model => model.id === modelId)
  return (configured?.status ?? user.value?.settings.default_model_availability ?? 'enabled') === 'enabled'
}

async function updateDefaultAvailability(value: string | string[]) {
  if (!user.value || policyMutatingId.value || typeof value !== 'string') return
  if (value !== 'enabled' && value !== 'disabled') return
  policyMutatingId.value = 'default'
  policyError.value = ''
  try {
    user.value = await api.users.replaceSettings({
      ...user.value.settings,
      default_model_availability: value,
    })
    await refresh()
  } catch (cause) {
    policyError.value = apiErrorMessage(cause, 'The default model policy could not be updated.')
  } finally {
    policyMutatingId.value = null
  }
}

async function updateModelPolicy(modelId: string, enabled: boolean) {
  if (!user.value || policyMutatingId.value) return
  policyMutatingId.value = modelId
  policyError.value = ''
  const status = enabled ? 'enabled' : 'disabled'
  const defaultStatus = user.value.settings.default_model_availability
  const configured = user.value.settings.configured_models.filter(model => model.id !== modelId)
  if (status !== defaultStatus) configured.push({ id: modelId, status })
  try {
    user.value = await api.users.replaceSettings({
      ...user.value.settings,
      configured_models: configured,
    })
    await refresh()
  } catch (cause) {
    policyError.value = apiErrorMessage(cause, `The policy for ${modelId} could not be updated.`)
  } finally {
    policyMutatingId.value = null
  }
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

async function selectModelSearchResult(item: { id: string }) {
  await router.replace({
    query: {
      ...route.query,
      model: item.id,
    },
  })
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
    <div class="models-policy">
      <div>
        <strong>Model policy</strong>
        <p>Choose the policy for unconfigured models, then override individual models below. A usable <NuxtLink to="/settings/providers">provider connection</NuxtLink> is still required for Louie.</p>
      </div>
      <UiSegmentedControl
        v-model="defaultAvailability"
        :options="defaultAvailabilityOptions"
        :disabled="Boolean(policyMutatingId) || !user"
        aria-label="Default model availability"
      />
    </div>
    <p v-if="policyError" class="models-policy-error" role="alert">{{ policyError }}</p>

    <UiCatalogFilterBar
      v-model:status="modelStatus"
      v-model:category="modelLabs"
      v-model:sort="modelSort"
      v-model:search="modelSearchQuery"
      interactive
      :search-items="modelSearchItems"
      search-placeholder="Search models…"
      search-empty-title="No models found"
      search-empty-description="Try another model, lab, or family."
      :status-options="modelStatusOptions"
      third-label="Labs"
      third-icon="labs"
      :third-options="modelLabOptions"
      class="models-filters"
      @search-select="selectModelSearchResult"
    />

    <UiAsyncStage
      :status="status"
      :empty="models.length === 0"
      loading-label="Loading models…"
      error-label="Models could not be loaded."
      empty-label="No models found."
      @retry="refresh"
    >
      <UiGrid :columns="3" gap="lg" class="models-grid">
        <UiPill
          v-for="model in models"
          :id="`model-${model.id}`"
          :key="model.id"
          class="model-item"
          :class="{ 'model-item--focused': focusedModelId() === model.id }"
          variant="catalog"
          icon-style="circle"
          :src="providerLogo(model.vendor, model.family) || undefined"
          alt=""
          :description="model.name"
          toggle
          :toggle-value="modelPolicyEnabled(model.id)"
          :toggle-disabled="Boolean(policyMutatingId) || !user"
          :toggle-label="`${modelPolicyEnabled(model.id) ? 'Disable' : 'Enable'} ${model.name}`"
          :action-icon-path="arrowSquareOutIconPath"
          :action-href="officialModelPage(model)"
          :action-label="`View official information about ${model.name}`"
          action-target="_blank"
          action-visibility="hover"
          @update:toggle-value="updateModelPolicy(model.id, $event)"
        >
          <template v-if="!providerLogo(model.vendor, model.family)" #icon>
            <span class="model-item__fallback">{{ vendorInitials(model.vendor) }}</span>
          </template>
          <span class="model-item__label">
            <span>{{ model.vendor }}</span>
            <UiStatusText :tone="model.available ? 'enabled' : 'disabled'" class="model-item__availability">
              {{ model.available ? 'available' : 'unavailable' }}
            </UiStatusText>
          </span>
        </UiPill>
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

.models-policy { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-6); padding: var(--ll-space-5); margin-bottom: var(--ll-space-6); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.models-policy > div { display: grid; gap: var(--ll-space-1); }
.models-policy strong, .models-policy p { margin: 0; }
.models-policy p { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
.models-policy a { color: var(--ll-color-ink); }
.models-policy-error { margin: calc(-1 * var(--ll-space-3)) 0 var(--ll-space-5); color: var(--ll-color-brand-ink); font-size: var(--ll-text-sm); }

.models-grid { column-gap: var(--ll-space-20); }

.model-item {
  min-width: 0;
}

.model-item--focused {
  background: var(--ll-color-primary-highlight);
  border-color: var(--ll-color-primary);
  box-shadow: 0 0 0 3px var(--ll-color-primary-highlight);
}

.model-item__fallback {
  color: var(--ll-color-ink);
  font: 600 0.6875rem / 1 var(--ll-font-mono);
}

.model-item__label {
  display: inline-flex;
  max-width: 100%;
  align-items: baseline;
  gap: var(--ll-space-2);
}

.model-item__label > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-item__availability {
  flex: none;
  font-size: var(--ll-text-xs);
  font-weight: 500;
}

@media (max-width: 48rem) { .models-policy { align-items: flex-start; flex-direction: column; } }

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
