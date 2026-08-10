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
  flow: string | null
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

const route = useRoute()
const router = useRouter()
const loops = computed(() => data.value?.items ?? [])
const loopStatus = ref('all')
const loopSort = ref('alphabetical-asc')

const loopStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'running', label: 'Running' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const loopFlowOptions = [
  { value: 'all', label: 'All' },
  { value: 'direct', label: 'Direct' },
  { value: 'refinement', label: 'Refinement' },
  { value: 'roundtable', label: 'Roundtable' },
]

const validFlows = new Set(loopFlowOptions.map(option => option.value))

function flowFromQuery(value: unknown): string {
  const flow = Array.isArray(value) ? value[0] : value
  return typeof flow === 'string' && validFlows.has(flow) ? flow : 'all'
}

function statusForFilter(status: string): string {
  return status.toLowerCase() === 'disabled' ? 'inactive' : status.toLowerCase()
}

function flowForFilter(flow: string | null): string {
  return flow?.toLowerCase() || 'draft'
}

const loopFlow = ref(flowFromQuery(route.query.flow))

watch(() => route.query.flow, (flow) => {
  loopFlow.value = flowFromQuery(flow)
})

watch(loopFlow, async (flow) => {
  const currentFlow = flowFromQuery(route.query.flow)
  if (flow === currentFlow && (flow !== 'all' || route.query.flow == null)) return

  const query = { ...route.query }
  if (flow === 'all') delete query.flow
  else query.flow = flow
  await router.replace({ query })
})

const displayedLoops = computed(() => {
  const filtered = loops.value.filter(loop => (
    (loopStatus.value === 'all' || statusForFilter(loop.status) === loopStatus.value)
    && (loopFlow.value === 'all' || flowForFilter(loop.flow) === loopFlow.value)
  ))

  return [...filtered].sort((first, second) => {
    if (loopSort.value === 'alphabetical-desc') return second.title.localeCompare(first.title)
    if (loopSort.value === 'newest') return Date.parse(second.updated_at) - Date.parse(first.updated_at)
    if (loopSort.value === 'oldest') return Date.parse(first.updated_at) - Date.parse(second.updated_at)
    return first.title.localeCompare(second.title)
  })
})

const displayedDrafts = computed(() => displayedLoops.value.filter(loop => loop.status === 'draft'))
const displayedPublished = computed(() => displayedLoops.value.filter(loop => loop.status !== 'draft'))

const { formatDate } = useDateTime()

function loopStatusTone(value: string) {
  return ['disabled', 'draft'].includes(value.toLowerCase()) ? 'disabled' : 'enabled'
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
          <UiButton to="/app/loops/new">Add new loop</UiButton>
        </div>
      </template>
    </UiHeadingBlock>

    <UiCatalogFilterBar
      v-model:status="loopStatus"
      v-model:category="loopFlow"
      v-model:sort="loopSort"
      interactive
      :show-search="false"
      :status-options="loopStatusOptions"
      third-label="Flow"
      third-icon="scribble-loop"
      third-selection-type="radio"
      :third-options="loopFlowOptions"
      class="catalog-filters"
    />

    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading loops…</div>
    <div v-else-if="error" class="catalog-state catalog-state--error" role="alert">
      <span>Loops could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="bottom" class="catalog-stage">
      <div v-if="displayedLoops.length === 0" class="catalog-state">No loops match these filters.</div>
      <div v-else class="catalog-groups">
        <section v-if="displayedDrafts.length" class="catalog-group" aria-labelledby="draft-loops-heading">
          <div class="catalog-group__heading">
            <h2 id="draft-loops-heading">Continue where you left off</h2>
            <span>{{ displayedDrafts.length }} draft{{ displayedDrafts.length === 1 ? '' : 's' }}</span>
          </div>
          <UiGrid :columns="3" gap="md">
            <UiCard
              v-for="loop in displayedDrafts"
              :key="loop.id"
              :to="`/app/loops/new?draft=${encodeURIComponent(loop.id)}`"
              variant="editorial"
              accent-on-hover
              class="catalog-card"
            >
              <template #eyebrow>Draft</template>
              <template #title><h2>{{ loop.title }}</h2></template>
              <template #description><p>{{ loop.description }}</p></template>
              <template #meta><time :datetime="loop.updated_at">Updated {{ formatDate(loop.updated_at) }}</time></template>
              <template #trailing><UiStatusText tone="disabled" activation="card-hover">Continue</UiStatusText></template>
            </UiCard>
          </UiGrid>
        </section>

        <section v-if="displayedPublished.length" class="catalog-group" aria-label="Published loops">
          <UiGrid :columns="3" gap="md">
        <UiCard
          v-for="loop in displayedPublished"
          :key="loop.id"
          :to="`/app/loops/${encodeURIComponent(loop.id)}`"
          variant="editorial"
          accent-on-hover
          class="catalog-card"
        >
          <template #eyebrow>{{ loop.flow }}</template>
          <template #title>
            <h2>{{ loop.title }}</h2>
          </template>
          <template #description>
            <p>{{ loop.description }}</p>
            <LoopCardDetails
              :agents="loop.agents"
              :stop-conditions="loop.stop_conditions"
            />
          </template>
          <template #meta>
            <time :datetime="loop.updated_at">{{ formatDate(loop.updated_at) }}</time>
          </template>
          <template #trailing>
            <UiStatusText :tone="loopStatusTone(loop.status)" activation="card-hover">
              {{ loop.status }}
            </UiStatusText>
          </template>
        </UiCard>
          </UiGrid>
        </section>
      </div>
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

.catalog-groups,
.catalog-group { display: grid; gap: var(--ll-space-6); }
.catalog-groups { gap: var(--ll-space-10); }
.catalog-group__heading { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ll-space-4); }
.catalog-group__heading h2 { margin: 0; color: var(--ll-color-ink); font: 600 1.1rem / 1.2 var(--ll-font-display); }
.catalog-group__heading span { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }

.catalog-card:hover {
  z-index: 2;
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

</style>
