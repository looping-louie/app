<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiIconPill from '~/components/ui/IconPill.vue'
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

    <div class="catalog-filters" role="group" aria-label="Agent filters">
      <div class="catalog-filters__group">
        <UiIconPill aria-label="Search agents">
          <template #icon>
            <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
              <path d="M229.66,218.34l-50.07-50.06a88.1,88.1,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
            </svg>
          </template>
          Search
        </UiIconPill>

        <UiIconPill aria-label="Filter agents by status">
          <template #icon>
            <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
              <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
            </svg>
          </template>
          Status
        </UiIconPill>

        <UiIconPill aria-label="Filter agents by department">
          <template #icon>
            <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
              <path d="M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z" />
            </svg>
          </template>
          Department
        </UiIconPill>
      </div>

      <UiIconPill aria-label="Sort agents">
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z" />
          </svg>
        </template>
        Sort
      </UiIconPill>
    </div>

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
  margin-bottom: var(--ll-space-10);
}

.catalog-filters__group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-3);
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

@media (max-width: 38rem) {
  .catalog-filters {
    align-items: flex-start;
  }
}
</style>
