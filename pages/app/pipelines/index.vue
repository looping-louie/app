<script setup lang="ts">
import CatalogShell from '~/components/catalog/CatalogShell.vue'
import UiCard from '~/components/ui/Card.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { ActivityResponse, PipelineResponse } from '~/types/api'

interface PipelineCatalogItem extends PipelineResponse {
  activities: ActivityResponse[]
}

const api = useApiClient()
const { resolve: resolveActivities } = usePipelineActivities()

const { data, status, refresh } = await useAsyncData(
  'pipelines-catalog',
  async () => {
    const page = await api.pipelines.list({ offset: 0 })
    return await Promise.all(page.items.map(async pipeline => ({
      ...pipeline,
      activities: await resolveActivities(pipeline.steps),
    })))
  },
)

const pipelines = computed(() => data.value ?? [])
const pipelineStatus = ref('all')
const pipelineStep = ref('all')
const pipelineSort = ref('alphabetical-asc')

const pipelineStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

const pipelineStepOptions = [
  { value: 'all', label: 'All' },
  { value: 'loop', label: 'Loops' },
  { value: 'human_gate', label: 'Human gates' },
]

const displayedPipelines = computed(() => {
  const filtered = pipelines.value.filter(pipeline => (
    (pipelineStatus.value === 'all' || pipelineStatusValue(pipeline) === pipelineStatus.value)
    && (pipelineStep.value === 'all' || pipeline.activities.some(activity => activityKind(activity) === pipelineStep.value))
  ))

  return [...filtered].sort((first, second) => {
    if (pipelineSort.value === 'alphabetical-desc') return second.title.localeCompare(first.title)
    if (pipelineSort.value === 'newest') return Date.parse(second.updated_at) - Date.parse(first.updated_at)
    if (pipelineSort.value === 'oldest') return Date.parse(first.updated_at) - Date.parse(second.updated_at)
    return first.title.localeCompare(second.title)
  })
})

const { formatDate } = useDateTime()

function pipelineStatusValue(pipeline: PipelineCatalogItem) {
  return pipeline.enabled ? 'active' : 'disabled'
}

function pipelineStatusLabel(pipeline: PipelineCatalogItem) {
  return pipeline.enabled ? 'Active' : 'Disabled'
}

function pipelineStatusTone(pipeline: PipelineCatalogItem) {
  return pipeline.enabled ? 'enabled' : 'disabled'
}

function activityKind(activity: ActivityResponse) {
  return activity.type.endsWith('_loop') ? 'loop' : 'human_gate'
}

function countSteps(pipeline: PipelineCatalogItem, type: 'loop' | 'human_gate') {
  return pipeline.activities.filter(activity => activityKind(activity) === type).length
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Pipelines · Looping Louie',
})
</script>

<template>
  <CatalogShell
    title="Pipelines"
    description="Ordered workflows that connect loops with human checkpoints."
    :status="status"
    :empty="displayedPipelines.length === 0"
    loading-label="Loading pipelines…"
    error-label="Pipelines could not be loaded."
    empty-label="No pipelines match these filters."
    @retry="refresh"
  >
    <template #actions><UiButton to="/app/pipelines/new">Create new pipeline</UiButton></template>
    <template #filters>
      <UiCatalogFilterBar
        v-model:status="pipelineStatus"
        v-model:category="pipelineStep"
        v-model:sort="pipelineSort"
        interactive
        :show-search="false"
        :status-options="pipelineStatusOptions"
        third-label="Step"
        third-icon="task"
        third-selection-type="radio"
        :third-options="pipelineStepOptions"
      />
    </template>

    <UiGrid :columns="3" gap="md">
        <UiCard
          v-for="pipeline in displayedPipelines"
          :key="pipeline.id"
          :to="`/app/pipelines/${encodeURIComponent(pipeline.id)}`"
          variant="editorial"
          accent-on-hover
          class="catalog-card"
        >
          <template #eyebrow>{{ pipeline.steps.length }} {{ pipeline.steps.length === 1 ? 'step' : 'steps' }}</template>
          <template #title>
            <h2>{{ pipeline.title }}</h2>
          </template>
          <template #description>
            <p>{{ pipeline.description }}</p>
            <dl class="pipeline-details">
              <div>
                <dt>Loops</dt>
                <dd>{{ countSteps(pipeline, 'loop') }}</dd>
              </div>
              <div>
                <dt>Human gates</dt>
                <dd>{{ countSteps(pipeline, 'human_gate') }}</dd>
              </div>
            </dl>
          </template>
          <template #meta>
            <time :datetime="pipeline.updated_at">{{ formatDate(pipeline.updated_at) }}</time>
          </template>
          <template #trailing>
            <UiStatusText :tone="pipelineStatusTone(pipeline)" activation="card-hover">
              {{ pipelineStatusLabel(pipeline) }}
            </UiStatusText>
          </template>
        </UiCard>
    </UiGrid>
  </CatalogShell>
</template>

<style scoped>
.catalog-card {
  position: relative;
  overflow: visible;
}

.catalog-card :deep(.ui-card__description > p) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.catalog-card:hover {
  z-index: 2;
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.pipeline-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-4);
  margin: var(--ll-space-5) 0 0;
  padding-top: var(--ll-space-4);
  border-top: 1px solid var(--ll-color-divider);
}

.pipeline-details div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ll-space-2);
}

.pipeline-details dt {
  color: var(--ll-color-text-faint);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pipeline-details dd {
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}
</style>
