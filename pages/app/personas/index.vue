<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'

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

const { data, status, error, refresh } = await useAsyncData(
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
  <UiContainer size="wide" class="catalog-page">
    <UiHeadingBlock layout="split" size="section" align="start" class="catalog-heading">
      <template #title>
        <h1>Agents</h1>
      </template>
      <template #description>
        <p>Agent roles available to loops and pipelines.</p>
      </template>
    </UiHeadingBlock>

    <UiCatalogFilterBar
      v-model:status="agentStatus"
      v-model:category="agentDepartments"
      v-model:sort="agentSort"
      interactive
      :show-search="false"
      :third-options="agentDepartmentOptions"
      class="catalog-filters"
    />

    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading agents…</div>
    <div v-else-if="error" class="catalog-state catalog-state--error" role="alert">
      <span>Agents could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="bottom" class="catalog-stage">
      <div v-if="agents.length === 0" class="catalog-state">No agents found.</div>
      <UiGrid v-else :columns="4" gap="md">
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
    </UiSectionStage>
  </UiContainer>
</template>

<style scoped>
.catalog-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.catalog-heading {
  margin-bottom: var(--ll-space-6);
}

.catalog-filters {
  margin-bottom: var(--ll-space-10);
}

.catalog-stage :deep(.ui-section-stage__shell) {
  width: 100%;
}

.catalog-state {
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

.catalog-state--error {
  color: var(--ll-color-brand-ink);
}

.catalog-state button {
  padding: var(--ll-space-2) var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  cursor: pointer;
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-control);
}

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
