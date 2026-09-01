<script setup lang="ts">
import ExecutionHarnessSelector from '~/components/execution/HarnessSelector.vue'
import ExecutionModelSelector from '~/components/execution/ModelSelector.vue'
import PageShell from '~/components/layout/PageShell.vue'
import PipelineCanvas from '~/components/pipelines/PipelineCanvas.vue'
import type { PipelineCanvasActivity } from '~/components/pipelines/PipelineCanvas.vue'
import PipelineDesignEditor from '~/components/pipelines/PipelineDesignEditor.vue'
import PipelineRunModal from '~/components/pipelines/PipelineRunModal.vue'
import UiButton from '~/components/ui/Button.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import type {
  ActivityLoopConfig,
  ExecutionHarness,
  PipelineActivityStepRequest,
  PipelinePatchRequest,
} from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'
import { modelIdLabel } from '~/utils/executionDefaults'
import { pipelineStepRequestsFromResponse } from '~/utils/pipelineSteps'

interface DetailRow {
  id: string
  title: string
  kind: 'status' | 'created' | 'execution' | 'design'
  value?: string
  [key: string]: unknown
}

const route = useRoute()
const router = useRouter()
const pipelineId = computed(() => String(route.params.id))
const { formatDate } = useDateTime()
const api = useApiClient()
const editing = ref(false)
const saving = ref(false)
const editName = ref('')
const editDescription = ref('')
const editEnabled = ref(true)
const editModelId = ref<string | null>(null)
const editHarness = ref<ExecutionHarness | null>(null)
const editSteps = ref<PipelineActivityStepRequest[]>([])
const editDesignDirty = ref(false)
const editDesignValid = ref(false)
const editDesignMessage = ref('')
const editError = ref('')
const editNameElement = ref<HTMLElement | null>(null)
const editDescriptionElement = ref<HTMLElement | null>(null)
const duplicating = ref(false)
const actionError = ref('')
const deleteModalOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const runModalOpen = ref(false)

const statusOptions = [
  { value: 'active', label: 'active' },
  { value: 'disabled', label: 'disabled' },
]
const pipelineActionMenuOptions = [
  {
    value: 'edit',
    label: 'Edit',
    iconPath: 'M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120ZM216,84.69l-24,24L147.31,64l24-24L216,84.69Z',
  },
  ...entityActionMenuOptions,
]

const { data: pipeline, status, error, refresh } = await useAsyncData(
  () => `pipeline-${pipelineId.value}`,
  () => api.pipelines.get(pipelineId.value),
)
const { data: executionOptions, refresh: refreshExecutionOptions } = await useAsyncData(
  'pipeline-detail-execution-options',
  async () => {
    const [user, models] = await Promise.all([
      api.users.getCurrent(),
      api.models.list({ sort: 'alphabetical-asc' }),
    ])
    return { defaults: user.settings, models: models.items }
  },
)

const statusValue = computed(() => pipeline.value?.enabled ? 'active' : 'disabled')
const editStatusValue = computed(() => editEnabled.value ? 'active' : 'disabled')
const breadcrumbItems = computed(() => [
  { label: 'Pipelines', to: '/pipelines' },
  { label: statusValue.value === 'active' ? 'Active' : 'Disabled' },
])
const detailItems = computed<DetailRow[]>(() => {
  if (!pipeline.value) return []
  return [
    { id: 'status', title: 'Status', kind: 'status', value: statusValue.value },
    ...(!editing.value ? [{ id: 'created', title: 'Created', kind: 'created' as const }] : []),
    { id: 'execution', title: 'Execution', kind: 'execution' },
    { id: 'design', title: 'Design', kind: 'design' },
  ]
})
const editInheritedModelId = computed(() => editModelId.value ?? executionOptions.value?.defaults.default_model_id ?? null)
const editInheritedHarness = computed(() => editHarness.value ?? executionOptions.value?.defaults.default_harness ?? null)
const displayedModelId = computed(() => pipeline.value?.model_id ?? executionOptions.value?.defaults.default_model_id ?? null)
const displayedHarness = computed(() => pipeline.value?.harness ?? executionOptions.value?.defaults.default_harness ?? null)
const canSaveEditing = computed(() => (
  editDesignValid.value
  && Boolean(editName.value.trim())
  && Boolean(editDescription.value.trim())
  && !saving.value
))

const createdBy = computed(() => 'user')
const canvasActivities = computed<PipelineCanvasActivity[]>(() => {
  const result: PipelineCanvasActivity[] = []
  pipeline.value?.steps.forEach((activity, index) => {
    const instanceId = `pipeline-detail-step-${index}`
    if (activity.type.endsWith('_loop')) {
      const config = activity.config as ActivityLoopConfig
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
    result.push({
      instanceId,
      type: 'human-gate',
      gate: isQuiz ? 'multiple-choice-quiz' : 'human-review',
      title: activity.name,
    })
  })
  return result
})

function editableText(element: HTMLElement | null) {
  return element?.innerText.replace(/\u00a0/g, ' ').trim() ?? ''
}

function beginEditing() {
  if (!pipeline.value || saving.value) return
  editName.value = pipeline.value.name
  editDescription.value = pipeline.value.description
  editEnabled.value = pipeline.value.enabled
  editModelId.value = pipeline.value.model_id
  editHarness.value = pipeline.value.harness
  editSteps.value = pipelineStepRequestsFromResponse(pipeline.value.steps)
  editDesignDirty.value = false
  editDesignValid.value = false
  editDesignMessage.value = ''
  editError.value = ''
  actionError.value = ''
  editing.value = true
  nextTick(() => editNameElement.value?.focus())
}

function cancelEditing() {
  if (saving.value) return
  editing.value = false
  editError.value = ''
}

function markEditDirty() {
  editError.value = ''
}

function markEditDesignDirty() {
  editDesignDirty.value = true
  markEditDirty()
}

function updateEditStatus(value: string | string[]) {
  const selected = Array.isArray(value) ? value[0] : value
  if (selected === 'active' || selected === 'disabled') {
    editEnabled.value = selected === 'active'
    editError.value = ''
  }
}

function updateEditSteps(steps: PipelineActivityStepRequest[]) {
  editSteps.value = steps
}

function updateEditDesignValidity(valid: boolean, message: string) {
  editDesignValid.value = valid
  editDesignMessage.value = message
}

async function saveEditing() {
  if (!pipeline.value || saving.value) return
  const name = editableText(editNameElement.value)
  const description = editableText(editDescriptionElement.value)
  if (!name || !description) {
    editError.value = !name ? 'Give this pipeline a name.' : 'Describe what this pipeline does.'
    return
  }
  if (!editDesignValid.value) {
    editError.value = editDesignMessage.value || 'Complete the pipeline design before saving.'
    return
  }
  saving.value = true
  editError.value = ''
  try {
    const body: PipelinePatchRequest = {
      name,
      description,
      enabled: editEnabled.value,
      model_id: editModelId.value,
      harness: editHarness.value,
    }
    if (editDesignDirty.value) body.steps = editSteps.value
    pipeline.value = await api.pipelines.patch(pipelineId.value, body)
    editing.value = false
    clearNuxtData('pipelines-catalog')
  } catch (cause) {
    editError.value = apiErrorMessage(cause, 'The pipeline could not be saved. Please try again.')
    await refreshExecutionOptions()
  } finally {
    saving.value = false
  }
}

async function duplicatePipeline() {
  if (!pipeline.value || duplicating.value) return
  duplicating.value = true
  actionError.value = ''
  try {
    const duplicate = await api.pipelines.create({
      name: `${pipeline.value.name} (Copy)`,
      description: pipeline.value.description,
      steps: pipelineStepRequestsFromResponse(pipeline.value.steps),
      model_id: pipeline.value.model_id,
      harness: pipeline.value.harness,
    })
    clearNuxtData('pipelines-catalog')
    await router.push(`/pipelines/${encodeURIComponent(duplicate.id)}`)
    pipeline.value = duplicate
  } catch (cause) {
    actionError.value = apiErrorMessage(cause, 'The pipeline could not be duplicated. Please try again.')
  } finally {
    duplicating.value = false
  }
}

function selectAction(option: { value: string }) {
  if (option.value === 'edit') {
    beginEditing()
    return
  }
  if (option.value === 'duplicate') {
    void duplicatePipeline()
    return
  }
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
    window.location.replace('/pipelines')
  } catch (cause) {
    deleteError.value = apiErrorMessage(cause, 'The pipeline could not be deleted. Please try again.')
  } finally {
    deleting.value = false
  }
}

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
    :breadcrumbs="pipeline ? breadcrumbItems : []"
    :show-heading="Boolean(pipeline)"
  >
    <template #title>
      <h1
        v-if="pipeline"
        ref="editNameElement"
        :class="{ 'pipeline-editable': editing }"
        :contenteditable="editing ? 'true' : undefined"
        :role="editing ? 'textbox' : undefined"
        :tabindex="editing ? 0 : undefined"
        spellcheck="true"
        @input="markEditDirty"
        @keydown.enter.prevent
      >{{ editing ? editName : pipeline.name }}</h1>
    </template>
    <template #description>
      <p
        v-if="pipeline"
        ref="editDescriptionElement"
        :class="{ 'pipeline-editable': editing }"
        :contenteditable="editing ? 'true' : undefined"
        :role="editing ? 'textbox' : undefined"
        :tabindex="editing ? 0 : undefined"
        spellcheck="true"
        @input="markEditDirty"
      >{{ editing ? editDescription : pipeline.description }}</p>
    </template>
    <template #actions>
      <div v-if="pipeline" class="pipeline-actions">
        <template v-if="editing">
          <UiButton type="button" :disabled="!canSaveEditing" :loading="saving" @click="saveEditing">Save</UiButton>
          <UiButton type="button" variant="secondary" :disabled="saving" @click="cancelEditing">Cancel</UiButton>
        </template>
        <template v-else>
          <UiButton type="button" @click="runModalOpen = true">Run</UiButton>
          <UiButton
            type="button"
            variant="stroke"
            dropdown
            dropdown-align="right"
            icon-only
            aria-label="More pipeline actions"
            dropdown-label="Pipeline actions"
            :options="pipelineActionMenuOptions"
            :disabled="deleting || duplicating"
            :loading="duplicating"
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
        </template>
      </div>
    </template>

    <div v-if="status === 'pending'" class="pipeline-state" role="status">Loading pipeline…</div>
    <div v-else-if="error" class="pipeline-state pipeline-state--error" role="alert">
      <span>Pipeline could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>

    <template v-else-if="pipeline">
      <PipelineRunModal
        v-model:open="runModalOpen"
        :pipeline-id="pipeline.id"
        :pipeline-name="pipeline.name"
      />
      <p v-if="actionError" class="pipeline-action-error" role="alert">{{ actionError }}</p>
      <p v-if="editError" class="pipeline-edit-error" role="alert">{{ editError }}</p>

      <section class="pipeline-details" aria-label="Pipeline configuration">
        <UiSectionStage inverse="bottom" class="pipeline-details-stage">
          <UiGridList
            :items="detailItems"
            variant="key-value"
            aria-label="Pipeline configuration"
            class="pipeline-details-grid"
          >
            <template #leading="{ item }"><h4>{{ item.title }}</h4></template>

            <template #metadata="{ item }">
              <div v-if="item.kind === 'status'" class="pipeline-status">
                <UiPill
                  v-if="editing"
                  :model-value="editStatusValue"
                  clickable
                  selection-type="radio"
                  :options="statusOptions"
                  dropdown-label="Status"
                  aria-label="Choose pipeline status"
                  @update:model-value="updateEditStatus"
                >
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
                    </svg>
                  </template>
                  {{ editStatusValue }}
                </UiPill>
                <UiPill v-else>{{ item.value }}</UiPill>
              </div>

              <p v-else-if="item.kind === 'created'" class="pipeline-created">
                By {{ createdBy }} at
                <time :datetime="pipeline.created_at">{{ formatDate(pipeline.created_at) }}</time>
              </p>

              <div v-else-if="item.kind === 'execution'" class="pipeline-execution">
                <template v-if="editing">
                  <ExecutionModelSelector
                    v-model="editModelId"
                    :models="executionOptions?.models ?? []"
                    :harness="editInheritedHarness"
                    inherit-label="Inherit user model"
                    :inherit-description="executionOptions?.defaults.default_model_id ? `Currently ${executionOptions.defaults.default_model_id}.` : 'No user model is configured.'"
                    @update:model-value="markEditDirty"
                  />
                  <ExecutionHarnessSelector
                    v-model="editHarness"
                    inherit-label="Inherit user default"
                    :inherit-description="executionOptions?.defaults.default_harness ? `Currently ${executionOptions.defaults.default_harness.kind} v1.` : 'No user override is configured; the API will use Louie v1.'"
                    @update:model-value="markEditDirty"
                  />
                </template>
                <dl v-else>
                  <div><dt>Model</dt><dd>{{ modelIdLabel(displayedModelId) }}</dd></div>
                  <div><dt>Source</dt><dd>{{ pipeline.model_id ? 'Pipeline override' : displayedModelId ? 'User default' : 'Not configured' }}</dd></div>
                  <div><dt>Harness</dt><dd>{{ displayedHarness?.kind ?? 'louie' }} v1</dd></div>
                  <div><dt>Source</dt><dd>{{ pipeline.harness ? 'Pipeline override' : executionOptions?.defaults.default_harness ? 'User default' : 'Compatibility default' }}</dd></div>
                </dl>
              </div>

              <div v-else-if="item.kind === 'design'" class="pipeline-design" :class="{ 'pipeline-design--editing': editing }">
                <PipelineDesignEditor
                  v-if="editing"
                  :initial-steps="pipeline.steps"
                  :inherited-model-id="editInheritedModelId"
                  :inherited-harness="editInheritedHarness"
                  :show-title="false"
                  :use-stage="false"
                  @update:steps="updateEditSteps"
                  @validity-change="updateEditDesignValidity"
                  @change="markEditDesignDirty"
                />
                <PipelineCanvas v-else :activities="canvasActivities" readonly aria-label="Pipeline design" />
              </div>
            </template>

            <template #trailing><span aria-hidden="true" /></template>
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
.pipeline-editable { border-radius: var(--ll-radius-sm); outline: 1px solid transparent; transition: outline-color var(--ll-duration-fast) var(--ll-ease-out), box-shadow var(--ll-duration-fast) var(--ll-ease-out); }
.pipeline-editable:hover { outline-color: var(--ll-color-divider); }
.pipeline-editable:focus { outline: 1px solid var(--ll-color-primary); box-shadow: 0 0 0 3px var(--ll-color-primary-highlight); }
.pipeline-details { min-width: 0; }
.pipeline-details-stage :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }
.pipeline-state { display: flex; min-height: 24rem; align-items: center; justify-content: center; gap: var(--ll-space-3); color: var(--ll-color-text-muted); }
.pipeline-state--error { color: var(--ll-color-brand-ink); }
.pipeline-delete-error,
.pipeline-action-error,
.pipeline-edit-error { margin: 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-sm) / 1.45 var(--ll-font-control); }
.pipeline-action-error,
.pipeline-edit-error { margin-bottom: var(--ll-space-4); }
.pipeline-status { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: var(--ll-space-2); }
.pipeline-created { display: flex; min-height: 2rem; flex-wrap: wrap; align-items: center; gap: 0.3em; margin: 0; color: var(--ll-color-text); }
.pipeline-execution { display: grid; width: 100%; gap: var(--ll-space-7); }
.pipeline-execution dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ll-space-4); margin: 0; }
.pipeline-execution dl div { display: grid; gap: var(--ll-space-1); }
.pipeline-execution dt { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
.pipeline-execution dd { margin: 0; color: var(--ll-color-ink); font: 500 var(--ll-text-sm) / 1.4 var(--ll-font-mono); }
.pipeline-design { display: flex; width: 100%; min-width: 0; box-sizing: border-box; flex-direction: column; align-items: stretch; padding: var(--ll-space-2) 0 var(--ll-space-8); }
.pipeline-design--editing { padding-top: 0; }
.pipeline-details-grid :deep(.ui-grid-list__row:has(.pipeline-design) .ui-grid-list__item) { grid-template-columns: minmax(9rem, 0.36fr) minmax(0, 1fr) auto; }
.pipeline-details-grid :deep(.ui-grid-list__row:has(.pipeline-design) .ui-grid-list__metadata) { display: block; width: 100%; grid-column: 1 / -1; grid-row: 2; }
@media (max-width: 48rem) { .pipeline-actions { justify-content: flex-start; } }
@media (max-width: 44rem) { .pipeline-design { padding-bottom: var(--ll-space-6); } }
@media (prefers-reduced-motion: reduce) { .pipeline-editable { transition: none; } }
</style>
