<script setup lang="ts">
import PipelineConnector from '~/components/pipelines/PipelineConnector.vue'
import PipelineHumanGateCard from '~/components/pipelines/PipelineHumanGateCard.vue'
import PipelineLoopCard from '~/components/pipelines/PipelineLoopCard.vue'
import PipelineOutcomeRoute from '~/components/pipelines/PipelineOutcomeRoute.vue'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'

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

interface PipelineDetail {
  id: string
  title: string
  description: string
  enabled: boolean
  steps: PipelineStep[]
  created_at: string
  updated_at: string
  user?: string | null
}

interface LoopAgent {
  persona_id: string
  model_id: string
  role: string
}

interface LoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

interface LoopSummary {
  id: string
  title: string
  description: string
  flow: string | null
  agents: LoopAgent[]
  stop_conditions: LoopStopConditions | null
}

interface PipelineView {
  pipeline: PipelineDetail
  loops: LoopSummary[]
}

interface DetailRow {
  id: string
  title: string
  kind: 'status' | 'created' | 'design'
  value?: string
}

interface ApiErrorEnvelope {
  error?: {
    message?: string
  }
}

const route = useRoute()
const pipelineId = computed(() => String(route.params.id))
const { formatDate } = useDateTime()
const editingStatus = ref(false)
const savingStatus = ref(false)
const updateError = ref('')
const highlightedOutcome = ref<'success' | 'failure' | null>(null)

const statusOptions = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
]

const { data: view, status, error, refresh } = await useAsyncData(
  () => `pipeline-${pipelineId.value}`,
  async (): Promise<PipelineView> => {
    const pipeline = await $fetch<PipelineDetail>(
      `/api/v1/pipelines/${encodeURIComponent(pipelineId.value)}`,
    )
    const loopIds = [...new Set(
      pipeline.steps
        .filter((step): step is PipelineLoopStep => step.type === 'loop')
        .map(step => step.loop_id),
    )]
    const loops = (await Promise.all(loopIds.map(async (loopId) => {
      try {
        return await $fetch<LoopSummary>(`/api/v1/loops/${encodeURIComponent(loopId)}`)
      } catch {
        return null
      }
    }))).filter((loop): loop is LoopSummary => loop !== null)
    return { pipeline, loops }
  },
)

const pipeline = computed(() => view.value?.pipeline)
const loopById = computed(() => new Map((view.value?.loops ?? []).map(loop => [loop.id, loop])))
const statusValue = computed(() => pipeline.value?.enabled ? 'active' : 'inactive')
const breadcrumbItems = computed(() => [
  { label: 'Pipelines', to: '/app/pipelines' },
  { label: statusValue.value === 'active' ? 'Active' : 'Inactive' },
])
const detailItems = computed<DetailRow[]>(() => {
  if (!pipeline.value) return []
  return [
    { id: 'status', title: 'Status', kind: 'status', value: statusValue.value },
    {
      id: 'created',
      title: 'Created',
      kind: 'created',
    },
    { id: 'design', title: 'Design', kind: 'design' },
  ]
})

const createdBy = computed(() => pipeline.value?.user?.trim() || 'user')

function loopForStep(step: PipelineLoopStep): LoopSummary {
  return loopById.value.get(step.loop_id) ?? {
    id: step.loop_id,
    title: step.loop_id,
    description: '',
    flow: null,
    agents: [],
    stop_conditions: null,
  }
}

function previousLoopDepth(index: number) {
  if (!pipeline.value) return 0
  for (let candidate = index - 1; candidate >= 0; candidate -= 1) {
    if (pipeline.value.steps[candidate]?.type === 'loop') return index - candidate
  }
  return 0
}

function failureModeFor(step: PipelineStep, index: number) {
  if (step.type === 'loop') return 'stop' as const
  if (step.gate_type === 'quiz') return 'retry' as const
  return previousLoopDepth(index) ? 'previous' as const : 'stop' as const
}

function apiErrorMessage(cause: unknown) {
  const data = (cause as { data?: ApiErrorEnvelope } | null)?.data
  return data?.error?.message
    ?? (cause instanceof Error ? cause.message : 'The pipeline could not be updated.')
}

async function selectStatus(value: string | string[]) {
  if (!pipeline.value || savingStatus.value) return
  const selected = Array.isArray(value) ? value[0] : value
  if (!selected || selected === statusValue.value) return

  savingStatus.value = true
  updateError.value = ''
  try {
    const updated = await $fetch<PipelineDetail>(
      `/api/v1/pipelines/${encodeURIComponent(pipelineId.value)}`,
      {
        method: 'PATCH',
        body: { enabled: selected === 'active' },
      },
    )
    if (view.value) view.value.pipeline = updated
    clearNuxtData('pipelines-catalog')
  } catch (cause) {
    updateError.value = apiErrorMessage(cause)
  } finally {
    savingStatus.value = false
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!editingStatus.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-pipeline-editor]')) return
  editingStatus.value = false
  updateError.value = ''
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))

definePageMeta({ layout: 'app' })

useHead(() => ({
  title: pipeline.value
    ? `${pipeline.value.title} · Pipelines · Looping Louie`
    : 'Pipeline · Looping Louie',
}))
</script>

<template>
  <UiContainer size="wide" class="pipeline-page">
    <div v-if="status === 'pending'" class="pipeline-state" role="status">Loading pipeline…</div>
    <div v-else-if="error" class="pipeline-state pipeline-state--error" role="alert">
      <span>Pipeline could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="refresh">Retry</UiButton>
    </div>

    <template v-else-if="pipeline">
      <UiBreadcrumb class="pipeline-breadcrumb" :items="breadcrumbItems" />

      <UiHeadingBlock layout="split" size="section" align="start" class="pipeline-heading">
        <template #title>
          <h1>{{ pipeline.title }}</h1>
        </template>
        <template #description>
          <p>{{ pipeline.description }}</p>
        </template>
        <template #aside>
          <div class="pipeline-actions">
            <UiButton type="button">Run</UiButton>
            <UiButton
              type="button"
              variant="secondary"
              dropdown
              dropdown-align="right"
              icon-only
              aria-label="More pipeline actions"
              dropdown-label="Pipeline actions"
              :options="entityActionMenuOptions"
            >
              <template #leading>
                <svg viewBox="0 0 256 256" fill="currentColor">
                  <circle cx="128" cy="56" r="12" />
                  <circle cx="128" cy="128" r="12" />
                  <circle cx="128" cy="200" r="12" />
                </svg>
              </template>
            </UiButton>
          </div>
        </template>
      </UiHeadingBlock>

      <section class="pipeline-details" aria-label="Pipeline configuration">
        <UiSectionStage inverse="bottom" class="pipeline-details-stage">
          <UiGridList
            :items="detailItems"
            variant="key-value"
            aria-label="Pipeline configuration"
            class="pipeline-details-grid"
          >
            <template #leading="{ item }">
              <h4>{{ item.title }}</h4>
            </template>

            <template #metadata="{ item }">
              <div v-if="item.kind === 'status'" class="pipeline-status" :data-pipeline-editor="editingStatus ? '' : undefined">
                <UiPill
                  v-if="editingStatus"
                  :model-value="statusValue"
                  clickable
                  selection-type="radio"
                  :options="statusOptions"
                  dropdown-label="Status"
                  aria-label="Choose pipeline status"
                  @update:model-value="selectStatus"
                >
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
                    </svg>
                  </template>
                  {{ statusValue }}
                </UiPill>
                <UiPill v-else>{{ item.value }}</UiPill>
                <p v-if="updateError" class="pipeline-status__error" role="alert">{{ updateError }}</p>
              </div>

              <p v-else-if="item.kind === 'created'" class="pipeline-created">
                By {{ createdBy }} at
                <time :datetime="pipeline.created_at">{{ formatDate(pipeline.created_at) }}</time>
              </p>

              <div v-else-if="item.kind === 'design'" class="pipeline-design">
                <div class="pipeline-design__input-node">
                  <UiPill class="pipeline-design__input-pill" :focusable="false">Input prompt</UiPill>
                  <PipelineConnector />
                </div>

                <ol class="pipeline-design__steps" aria-label="Pipeline design">
                  <li
                    v-for="(step, index) in pipeline.steps"
                    :key="step.type === 'loop' ? `${step.loop_id}-${index}` : `${step.gate_type}-${index}`"
                    class="pipeline-design__step"
                  >
                    <PipelineLoopCard
                      v-if="step.type === 'loop'"
                      :loop="loopForStep(step)"
                      :instance-id="`pipeline-detail-step-${index}`"
                      readonly
                    />
                    <PipelineHumanGateCard
                      v-else
                      :title="step.gate_type === 'quiz' ? 'Multiple-choice quiz' : 'Human review'"
                      :instance-id="`pipeline-detail-step-${index}`"
                      :gate="step.gate_type === 'quiz' ? 'multiple-choice-quiz' : 'human-review'"
                      :team-members="step.gate_type === 'approval' ? ['any-person'] : undefined"
                      :passing-score="step.config?.minimum_correct_answers"
                      readonly
                    />
                    <PipelineOutcomeRoute
                      :failure-mode="failureModeFor(step, index)"
                      :return-depth="previousLoopDepth(index) || 1"
                      :highlighted="highlightedOutcome"
                      @highlight="highlightedOutcome = $event"
                    />
                  </li>
                </ol>
              </div>
            </template>

            <template #trailing="{ item }">
              <button
                v-if="item.id === 'status' && !editingStatus"
                type="button"
                class="pipeline-inline-action"
                :disabled="savingStatus"
                @click="editingStatus = true"
              >
                <span>Edit</span><span aria-hidden="true">→</span>
              </button>
              <span v-else class="pipeline-inline-action pipeline-inline-action--placeholder" aria-hidden="true">Edit →</span>
            </template>
          </UiGridList>
        </UiSectionStage>
      </section>
    </template>
  </UiContainer>
</template>

<style scoped>
.pipeline-page { padding-block: var(--ll-space-10) var(--ll-space-16); }
.pipeline-breadcrumb { margin-bottom: var(--ll-space-4); }
.pipeline-heading { margin-bottom: var(--ll-space-8); }
.pipeline-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ll-space-3); }
.pipeline-details { min-width: 0; }
.pipeline-details-stage :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }
.pipeline-state { display: flex; min-height: 24rem; align-items: center; justify-content: center; gap: var(--ll-space-3); color: var(--ll-color-text-muted); }
.pipeline-state--error { color: var(--ll-color-brand-ink); }
.pipeline-status { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: var(--ll-space-2); }
.pipeline-status__error { flex: 1 0 100%; margin: 0; color: var(--ll-color-brand-ink); font-size: var(--ll-text-xs); line-height: 1.4; }
.pipeline-created { display: flex; min-height: 2rem; flex-wrap: wrap; align-items: center; gap: 0.3em; margin: 0; color: var(--ll-color-text); }
.pipeline-design { display: flex; width: 100%; min-width: 0; box-sizing: border-box; flex-direction: column; align-items: stretch; padding: var(--ll-space-2) 0 var(--ll-space-8); }
.pipeline-design__input-node { display: flex; flex-direction: column; align-items: center; }
.pipeline-design__input-pill :deep(.ui-icon-pill__trigger) { background: transparent; border-style: dashed; }
.pipeline-design__steps { width: 100%; min-width: 0; padding: 0; margin: 0; list-style: none; }
.pipeline-design__step { position: relative; width: 100%; }
.pipeline-details-grid :deep(.ui-grid-list__row:has(.pipeline-design) .ui-grid-list__item) { grid-template-columns: minmax(9rem, 0.36fr) minmax(0, 1fr) auto; }
.pipeline-details-grid :deep(.ui-grid-list__row:has(.pipeline-design) .ui-grid-list__metadata) { display: block; width: 100%; grid-column: 1 / -1; grid-row: 2; }
.pipeline-inline-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.125rem;
  color: var(--ll-color-primary-depth);
  background: transparent;
  border: 0;
  font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control);
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
  transition: color var(--ll-duration-normal) var(--ll-ease-out), opacity var(--ll-duration-normal) var(--ll-ease-out);
}
.pipeline-inline-action--placeholder { visibility: hidden; }
.pipeline-details-grid :deep(.ui-grid-list__row:hover) .pipeline-inline-action,
.pipeline-details-grid :deep(.ui-grid-list__row:focus-within) .pipeline-inline-action,
.pipeline-inline-action:focus-visible { opacity: 1; pointer-events: auto; }
.pipeline-inline-action:hover:not(:disabled) { color: var(--ll-color-primary); }
.pipeline-inline-action:focus-visible { outline: 2px solid var(--ll-color-primary); outline-offset: 3px; }
.pipeline-inline-action:disabled { cursor: wait; opacity: 0.55; }
@media (max-width: 48rem) { .pipeline-actions { justify-content: flex-start; } }
@media (max-width: 44rem) {
  .pipeline-design { padding-bottom: var(--ll-space-6); }
}
@media (prefers-reduced-motion: reduce) { .pipeline-inline-action { transition: none; } }
</style>
