<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPagination from '~/components/ui/Pagination.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { PersonaCategory, PersonaSort, PersonaStatus } from '~/types/api'
import { instructionCategoryLabels, instructionCategoryOptions } from '~/utils/instructionCategories'

const api = useApiClient()
const router = useRouter()
const { searchQuery: agentSearchQuery, searchTerm: agentSearchTerm } = useCatalogSearch()
const agentStatus = ref('all')
const agentCategories = ref<PersonaCategory[]>([])
const agentSort = ref<PersonaSort>('alphabetical-asc')
const agentOffset = ref(0)
const agentPageSize = 12

const agentQuery = computed(() => ({
  offset: agentOffset.value,
  status: agentStatus.value === 'all' ? undefined : agentStatus.value as PersonaStatus,
  category: agentCategories.value.length ? agentCategories.value : undefined,
  sort: agentSort.value,
  search: agentSearchTerm.value || undefined,
}))

const { data, status, refresh } = await useAsyncData(
  'agents-catalog',
  () => api.personas.list(agentQuery.value),
  { watch: [agentQuery] },
)

const agents = computed(() => data.value?.items ?? [])
const agentTotal = computed(() => data.value?.total ?? 0)

watch([agentStatus, agentCategories, agentSort, agentSearchTerm], () => {
  agentOffset.value = 0
}, { deep: true })

const { personaIcon } = usePersonaIcon()
const { formatDate } = useDateTime()
const agentSearchItems = computed(() => agents.value.map(agent => ({
  id: agent.id,
  label: agent.name,
  description: agent.description,
  group: 'Agents',
  keywords: agent.category ? [instructionCategoryLabels[agent.category]] : [],
  iconPath: personaIcon(agent),
})))

async function selectAgentSearchResult(item: { id: string }) {
  await router.push(`/personas/${encodeURIComponent(item.id)}`)
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Agents · Looping Louie',
})
</script>

<template>
  <PageShell
    title="Agents"
    description="Agent roles available to loops and pipelines."
  >
    <template #actions><UiButton to="/personas/new">Create new agent</UiButton></template>
    <template #toolbar>
      <UiCatalogFilterBar
        v-model:status="agentStatus"
        v-model:category="agentCategories"
        v-model:sort="agentSort"
        v-model:search="agentSearchQuery"
        interactive
        :search-items="agentSearchItems"
        search-placeholder="Search agents…"
        search-empty-title="No agents found"
        search-empty-description="Try another name, description, or area."
        third-label="Area"
        third-icon="department"
        :third-options="instructionCategoryOptions"
        @search-select="selectAgentSearchResult"
      />
    </template>

    <UiAsyncStage
      :status="status"
      :empty="agents.length === 0"
      loading-label="Loading agents…"
      error-label="Agents could not be loaded."
      empty-label="No agents found."
      @retry="refresh"
    >
      <UiGrid :columns="4" gap="md">
        <UiCard
          v-for="agent in agents"
          :key="agent.id"
          :to="`/personas/${encodeURIComponent(agent.id)}`"
          variant="media"
          accent-on-hover
          class="catalog-card"
        >
          <template #eyebrow>
            {{ agent.category ? instructionCategoryLabels[agent.category] : 'Uncategorised' }}
          </template>
          <template #title>
            <h2>{{ agent.name }}</h2>
          </template>
          <template #description>
            <p>{{ agent.description }}</p>
          </template>
          <template #meta>
            <time :datetime="agent.updated_at">{{ formatDate(agent.updated_at) }}</time>
          </template>
          <template #trailing>
            <UiStatusText
              :tone="agent.enabled ? 'enabled' : 'disabled'"
              activation="card-hover"
            >
              {{ agent.enabled ? 'enabled' : 'disabled' }}
            </UiStatusText>
          </template>
          <template #media>
            <div class="agent-media" aria-hidden="true">
              <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                <path :d="personaIcon(agent)" />
              </svg>
            </div>
          </template>
        </UiCard>
      </UiGrid>
    </UiAsyncStage>

    <template #footer>
      <UiPagination
        v-if="status === 'success'"
        v-model:offset="agentOffset"
        :total="agentTotal"
        :page-size="agentPageSize"
        aria-label="Agents pagination"
      />
    </template>
  </PageShell>
</template>

<style scoped>
.catalog-card :deep(.ui-card__description p) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.agent-media {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-highlight);
}

.agent-media svg {
  width: 5rem;
  height: 5rem;
}

</style>
