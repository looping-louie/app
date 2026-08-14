<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiCard from '~/components/ui/Card.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { PipelineActivityStepResponse, PipelineListItemResponse } from '~/types/api'

const api = useApiClient()

const { data, status, refresh } = await useAsyncData(
  'pipelines-catalog',
  async () => {
    const page = await api.pipelines.list({ offset: 0 })
    return page.items
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
  { value: 'checkpoint', label: 'Checkpoints' },
]

const displayedPipelines = computed(() => {
  const filtered = pipelines.value.filter(pipeline => (
    (pipelineStatus.value === 'all' || pipelineStatusValue(pipeline) === pipelineStatus.value)
    && (pipelineStep.value === 'all' || pipeline.steps.some(activity => activityKind(activity) === pipelineStep.value))
  ))

  return [...filtered].sort((first, second) => {
    if (pipelineSort.value === 'alphabetical-desc') return second.name.localeCompare(first.name)
    if (pipelineSort.value === 'newest') return Date.parse(second.updated_at) - Date.parse(first.updated_at)
    if (pipelineSort.value === 'oldest') return Date.parse(first.updated_at) - Date.parse(second.updated_at)
    return first.name.localeCompare(second.name)
  })
})

const { formatDate } = useDateTime()

function pipelineStatusValue(pipeline: PipelineListItemResponse) {
  return pipeline.enabled ? 'active' : 'disabled'
}

function pipelineStatusLabel(pipeline: PipelineListItemResponse) {
  return pipeline.enabled ? 'Active' : 'Disabled'
}

function pipelineStatusTone(pipeline: PipelineListItemResponse) {
  return pipeline.enabled ? 'enabled' : 'disabled'
}

function activityKind(activity: PipelineActivityStepResponse) {
  if (activity.type.endsWith('_loop')) return 'loop'
  if (activity.type === 'approval' || activity.type === 'quiz') return 'checkpoint'
  return 'hook'
}

function countSteps(pipeline: PipelineListItemResponse, type: 'loop' | 'checkpoint' | 'hook') {
  return pipeline.steps.filter(activity => activityKind(activity) === type).length
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Pipelines · Looping Louie',
})
</script>

<template>
  <PageShell
    title="Pipelines"
    description="Ordered workflows that connect loops with human checkpoints."
  >
    <template #actions><UiButton to="/app/pipelines/new">Create new pipeline</UiButton></template>
    <template #toolbar>
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

    <UiAsyncStage
      :status="status"
      :empty="displayedPipelines.length === 0"
      loading-label="Loading pipelines…"
      error-label="Pipelines could not be loaded."
      empty-label="No pipelines match these filters."
      @retry="refresh"
    >
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
            <h2>{{ pipeline.name }}</h2>
          </template>
          <template #description>
            <p>{{ pipeline.description }}</p>
            <dl class="pipeline-details">
              <div>
                <dt>Loops</dt>
                <dd>{{ countSteps(pipeline, 'loop') }}</dd>
              </div>
              <div>
                <dt>Checkpoints</dt>
                <dd>{{ countSteps(pipeline, 'checkpoint') }}</dd>
              </div>
              <div>
                <dt>Hooks</dt>
                <dd>{{ countSteps(pipeline, 'hook') }}</dd>
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
    </UiAsyncStage>
  </PageShell>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ll-space-4);
  margin: var(--ll-space-5) 0 0;
  padding-top: var(--ll-space-4);
  border-top: 1px solid var(--ll-color-divider);
}

.pipeline-details div {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: var(--ll-space-2);
  text-align: center;
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
