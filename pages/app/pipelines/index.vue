<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiStatusText from '~/components/ui/StatusText.vue'

interface PipelineLoopStep {
  type: 'loop'
  loop_id: string
}

interface PipelineQuizConfig {
  minimum_correct_answers: number
  question_count: number
  option_count: number
}

interface PipelineHumanGateStep {
  type: 'human_gate'
  gate_type: 'approval' | 'quiz'
  config: PipelineQuizConfig | null
}

type PipelineStep = PipelineLoopStep | PipelineHumanGateStep

interface PipelineSummary {
  id: string
  title: string
  description: string
  enabled: boolean
  steps: PipelineStep[]
  created_at: string
  updated_at: string
}

interface PipelineListResponse {
  items: PipelineSummary[]
  total: number
}

const { data, status, error, refresh } = await useAsyncData(
  'pipelines-catalog',
  () => $fetch<PipelineListResponse>('/api/v1/pipelines?offset=0'),
)

const pipelines = computed(() => data.value?.items ?? [])
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
    && (pipelineStep.value === 'all' || pipeline.steps.some(step => step.type === pipelineStep.value))
  ))

  return [...filtered].sort((first, second) => {
    if (pipelineSort.value === 'alphabetical-desc') return second.title.localeCompare(first.title)
    if (pipelineSort.value === 'newest') return Date.parse(second.updated_at) - Date.parse(first.updated_at)
    if (pipelineSort.value === 'oldest') return Date.parse(first.updated_at) - Date.parse(second.updated_at)
    return first.title.localeCompare(second.title)
  })
})

const { formatDate } = useDateTime()

function pipelineStatusValue(pipeline: PipelineSummary) {
  return pipeline.enabled ? 'active' : 'disabled'
}

function pipelineStatusLabel(pipeline: PipelineSummary) {
  return pipeline.enabled ? 'Active' : 'Disabled'
}

function pipelineStatusTone(pipeline: PipelineSummary) {
  return pipeline.enabled ? 'enabled' : 'disabled'
}

function countSteps(pipeline: PipelineSummary, type: PipelineStep['type']) {
  return pipeline.steps.filter(step => step.type === type).length
}

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Pipelines · Looping Louie',
})
</script>

<template>
  <UiContainer size="wide" class="catalog-page">
    <UiHeadingBlock layout="split" size="section" align="start" class="catalog-heading">
      <template #title>
        <h1>Pipelines</h1>
      </template>
      <template #description>
        <p>Ordered workflows that connect loops with human checkpoints.</p>
      </template>
      <template #aside>
        <div class="catalog-heading__actions">
          <UiButton to="/app/pipelines/new">Create new pipeline</UiButton>
        </div>
      </template>
    </UiHeadingBlock>

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
      class="catalog-filters"
    />

    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading pipelines…</div>
    <div v-else-if="error" class="catalog-state catalog-state--error" role="alert">
      <span>Pipelines could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="bottom" class="catalog-stage">
      <div v-if="displayedPipelines.length === 0" class="catalog-state">No pipelines match these filters.</div>
      <UiGrid v-else :columns="3" gap="md">
        <UiCard
          v-for="pipeline in displayedPipelines"
          :key="pipeline.id"
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
