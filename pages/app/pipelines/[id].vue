<script setup lang="ts">
import PipelineCanvas from '~/components/pipelines/PipelineCanvas.vue'
import type { PipelineCanvasActivity } from '~/components/pipelines/PipelineCanvas.vue'
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'
import type { LoopAgentInput, LoopStopConditions } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

interface HydratedLoopConfig {
  agents: LoopAgentInput[]
  stop_conditions: LoopStopConditions
}

interface HydratedQuizConfig {
  quiz: Record<string, unknown>
}

interface DetailRow {
  id: string
  title: string
  kind: 'status' | 'created' | 'design'
  value?: string
  [key: string]: unknown
}

const route = useRoute()
const pipelineId = computed(() => String(route.params.id))
const { formatDate } = useDateTime()
const editingStatus = ref(false)
const savingStatus = ref(false)
const updateError = ref('')
const deleteModalOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const api = useApiClient()

const statusOptions = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
]

const { data: pipeline, status, error, refresh } = await useAsyncData(
  () => `pipeline-${pipelineId.value}`,
  () => api.pipelines.get(pipelineId.value),
)

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

const createdBy = computed(() => 'user')
const canvasActivities = computed<PipelineCanvasActivity[]>(() => {
  const result: PipelineCanvasActivity[] = []
  pipeline.value?.steps.forEach((activity, index) => {
    const instanceId = `pipeline-detail-step-${index}`
    if (activity.type.endsWith('_loop')) {
      const config = activity.config as unknown as HydratedLoopConfig
      result.push({
        instanceId,
        type: 'loop',
        loop: {
          id: activity.id,
          title: activity.name,
          flow: activity.type.replace('_loop', ''),
          agents: config.agents,
          stop_conditions: config.stop_conditions,
        },
      })
      return
    }

    const isQuiz = activity.type === 'quiz'
    const quiz = isQuiz ? (activity.config as unknown as HydratedQuizConfig).quiz : undefined
    const passingScore = typeof quiz?.minimum_correct_answers === 'number'
      ? quiz.minimum_correct_answers
      : undefined
    result.push({
      instanceId,
      type: 'human-gate',
      gate: isQuiz ? 'multiple-choice-quiz' : 'human-review',
      title: activity.name,
      teamMembers: isQuiz ? undefined : ['any-person'],
      passingScore,
    })
  })
  return result
})

async function selectStatus(value: string | string[]) {
  if (!pipeline.value || savingStatus.value) return
  const selected = Array.isArray(value) ? value[0] : value
  if (!selected || selected === statusValue.value) return

  savingStatus.value = true
  updateError.value = ''
  try {
    const updated = await api.pipelines.patch(pipelineId.value, { enabled: selected === 'active' })
    pipeline.value = updated
    clearNuxtData('pipelines-catalog')
  } catch (cause) {
    updateError.value = apiErrorMessage(cause, 'The pipeline could not be updated.')
  } finally {
    savingStatus.value = false
  }
}

function selectAction(option: { value: string }) {
  if (option.value !== 'delete') return
  deleteError.value = ''
  deleteModalOpen.value = true
}

function updateDeleteModal(open: boolean) {
  if (!open && deleting.value) return
  deleteModalOpen.value = open
  if (!open) deleteError.value = ''
}

async function deletePipeline() {
  if (!pipeline.value || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await api.pipelines.remove(pipelineId.value)
    deleteModalOpen.value = false
    window.location.replace('/app/pipelines')
  } catch (cause) {
    deleteError.value = apiErrorMessage(cause, 'The pipeline could not be deleted. Please try again.')
  } finally {
    deleting.value = false
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
    ? `${pipeline.value.name} · Pipelines · Looping Louie`
    : 'Pipeline · Looping Louie',
}))
</script>

<template>
  <PageShell
    class="pipeline-page"
    :title="pipeline?.name"
    :description="pipeline?.description"
    :breadcrumbs="pipeline ? breadcrumbItems : []"
    :show-heading="Boolean(pipeline)"
  >
    <template #actions>
      <div v-if="pipeline" class="pipeline-actions">
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
          :disabled="deleting"
          @select="selectAction"
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

    <div v-if="status === 'pending'" class="pipeline-state" role="status">Loading pipeline…</div>
    <div v-else-if="error" class="pipeline-state pipeline-state--error" role="alert">
      <span>Pipeline could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>

    <template v-else-if="pipeline">
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
                <PipelineCanvas :activities="canvasActivities" readonly aria-label="Pipeline design" />
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

    <UiModal
      v-if="pipeline"
      :open="deleteModalOpen"
      title="Delete this pipeline?"
      :description="`This archives ${pipeline.name} and removes it from the active pipeline list. It cannot be edited or enabled afterwards.`"
      :close-on-backdrop="!deleting"
      :show-close="!deleting"
      @update:open="updateDeleteModal"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
      <p v-if="deleteError" class="pipeline-delete-error" role="alert">{{ deleteError }}</p>
      <template #actions>
        <UiButton data-autofocus variant="secondary" :disabled="deleting" @click="deleteModalOpen = false">Cancel</UiButton>
        <UiButton variant="coral" :loading="deleting" @click="deletePipeline">Delete pipeline</UiButton>
      </template>
    </UiModal>
  </PageShell>
</template>

<style scoped>
.pipeline-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ll-space-3); }
.pipeline-details { min-width: 0; }
.pipeline-details-stage :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }
.pipeline-state { display: flex; min-height: 24rem; align-items: center; justify-content: center; gap: var(--ll-space-3); color: var(--ll-color-text-muted); }
.pipeline-state--error { color: var(--ll-color-brand-ink); }
.pipeline-delete-error { margin: 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
.pipeline-status { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: var(--ll-space-2); }
.pipeline-status__error { flex: 1 0 100%; margin: 0; color: var(--ll-color-brand-ink); font-size: var(--ll-text-xs); line-height: 1.4; }
.pipeline-created { display: flex; min-height: 2rem; flex-wrap: wrap; align-items: center; gap: 0.3em; margin: 0; color: var(--ll-color-text); }
.pipeline-design { display: flex; width: 100%; min-width: 0; box-sizing: border-box; flex-direction: column; align-items: stretch; padding: var(--ll-space-2) 0 var(--ll-space-8); }
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
