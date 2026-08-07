<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import LoopCardDetails from '~/components/loops/LoopCardDetails.vue'

interface LoopAgent {
  model_id: string
  persona_id: string
}

interface LoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

interface LoopSummary {
  id: string
  flow: string
  title: string
  description: string
  status: string
  updated_at: string
  agents: LoopAgent[]
  stop_conditions: LoopStopConditions | null
}

interface LoopListResponse {
  items: LoopSummary[]
  total: number
}

const { data, status, error, refresh } = await useAsyncData(
  'loops-catalog',
  () => $fetch<LoopListResponse>('/api/v1/loops'),
)

const loops = computed(() => data.value?.items ?? [])
const loopStatus = ref('all')
const loopTasks = ref<string[]>([])
const loopSort = ref('alphabetical-asc')

const loopTaskOptions = [
  { value: 'coding', label: 'Coding' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'selling', label: 'Selling' },
  { value: 'writing', label: 'Writing' },
]

const loopDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatLoopDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : loopDateFormatter.format(date)
}

function loopStatusTone(value: string) {
  return value.toLowerCase() === 'disabled' ? 'disabled' : 'enabled'
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Loops · Looping Louie',
})
</script>

<template>
  <UiContainer size="wide" class="catalog-page">
    <UiHeadingBlock layout="split" size="section" align="start" class="catalog-heading">
      <template #title>
        <h1>Loops</h1>
      </template>
      <template #description>
        <p>Iterative workflows that bring agents, skills and review stages together.</p>
      </template>
      <template #aside>
        <div class="catalog-heading__actions">
          <UiButton type="button">Add new loop</UiButton>
        </div>
      </template>
    </UiHeadingBlock>

    <UiCatalogFilterBar
      v-model:status="loopStatus"
      v-model:category="loopTasks"
      v-model:sort="loopSort"
      interactive
      :show-search="false"
      third-label="Task"
      third-icon="task"
      :third-options="loopTaskOptions"
      class="catalog-filters"
    />

    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading loops…</div>
    <div v-else-if="error" class="catalog-state catalog-state--error" role="alert">
      <span>Loops could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="bottom" class="catalog-stage">
      <div v-if="loops.length === 0" class="catalog-state">No loops found.</div>
      <UiGrid v-else :columns="3" gap="md">
        <UiCard
          v-for="loop in loops"
          :key="loop.id"
          variant="editorial"
          accent-on-hover
          class="catalog-card"
        >
          <template #eyebrow>{{ loop.flow }}</template>
          <template #title>
            <NuxtLink :to="`/app/loops/${encodeURIComponent(loop.id)}`" class="catalog-card__title-link">
              <h2>{{ loop.title }}</h2>
            </NuxtLink>
          </template>
          <template #description>
            <p>{{ loop.description }}</p>
            <LoopCardDetails
              :agents="loop.agents"
              :stop-conditions="loop.stop_conditions"
            />
          </template>
          <template #meta>
            <time :datetime="loop.updated_at">{{ formatLoopDate(loop.updated_at) }}</time>
          </template>
          <template #trailing>
            <UiStatusText :tone="loopStatusTone(loop.status)" activation="card-hover">
              {{ loop.status }}
            </UiStatusText>
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

.catalog-heading__actions {
  display: flex;
  justify-content: flex-end;
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

.catalog-card {
  position: relative;
  overflow: visible;
}

.catalog-card:hover {
  z-index: 2;
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.catalog-card__title-link {
  color: inherit;
  text-decoration: none;
}

.catalog-card__title-link:focus-visible {
  border-radius: 0.125rem;
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}
</style>
