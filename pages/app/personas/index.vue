<script setup lang="ts">
import CatalogShell from '~/components/catalog/CatalogShell.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'

interface AgentSummary {
  id: string
  name: string
  description: string
  source_instruction_id: string | null
}

interface AgentListResponse {
  items: AgentSummary[]
  total: number
}

const { data, status, refresh } = await useAsyncData(
  'agents-catalog',
  () => $fetch<AgentListResponse>('/api/v1/personas'),
)

const agents = computed(() => data.value?.items ?? [])
const agentStatus = ref('all')
const agentDepartments = ref<string[]>([])
const agentSort = ref('alphabetical-asc')

const agentDepartmentOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'sales', label: 'Sales' },
]

const { personaIcon } = usePersonaIcon()

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Agents · Looping Louie',
})
</script>

<template>
  <CatalogShell
    title="Agents"
    description="Agent roles available to loops and pipelines."
    :status="status"
    :empty="agents.length === 0"
    loading-label="Loading agents…"
    error-label="Agents could not be loaded."
    empty-label="No agents found."
    @retry="refresh"
  >
    <template #filters>
      <UiCatalogFilterBar
        v-model:status="agentStatus"
        v-model:category="agentDepartments"
        v-model:sort="agentSort"
        interactive
        :show-search="false"
        :third-options="agentDepartmentOptions"
      />
    </template>

    <UiGrid :columns="4" gap="md">
        <UiCard
          v-for="agent in agents"
          :key="agent.id"
          :to="`/app/personas/${encodeURIComponent(agent.id)}`"
          variant="media"
          class="catalog-card"
        >
          <template #title>
            <h2>{{ agent.name }}</h2>
          </template>
          <template #description>
            <p>{{ agent.description }}</p>
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
  </CatalogShell>
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
