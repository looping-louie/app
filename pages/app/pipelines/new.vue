<script setup lang="ts">
import WizardShell from '~/components/layout/WizardShell.vue'
import PipelineDesignEditor from '~/components/pipelines/PipelineDesignEditor.vue'
import type { PipelineDesignDraft } from '~/components/pipelines/PipelineDesignEditor.vue'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { PipelineActivityStepRequest } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

type PipelineBuilderStep = 'design' | 'details'

const route = useRoute()
const router = useRouter()
const api = useApiClient()
const builderSteps = ['Design', 'Details']
const builderStep = ref<PipelineBuilderStep>(route.query.step === 'details' ? 'details' : 'design')
const pipelineTitle = ref('')
const pipelineDescription = ref('')
const detailErrors = reactive({ title: '', description: '' })
const savingPipeline = ref(false)
const saveError = ref('')
const designEditor = ref<InstanceType<typeof PipelineDesignEditor> | null>(null)
const designSteps = ref<PipelineActivityStepRequest[]>([])
const designDraft = ref<PipelineDesignDraft | null>(null)
const designValid = ref(false)
const designHint = ref('')
const exitModalOpen = ref(false)
const exitActionPending = ref(false)
const allowRouteLeave = ref(false)
const pendingDestination = ref('/app/pipelines')
const localKey = 'looping-louie:pipeline-builder-draft:v1'

const builderStepIndex = computed(() => builderStep.value === 'design' ? 0 : 1)
const hasProgress = computed(() => Boolean(
  designSteps.value.length
  || pipelineTitle.value.trim()
  || pipelineDescription.value.trim(),
))
const canSavePipeline = computed(() => (
  designValid.value
  && Boolean(pipelineTitle.value.trim())
  && Boolean(pipelineDescription.value.trim())
  && !savingPipeline.value
))
const breadcrumbItems = computed(() => [
  { label: 'Pipelines', to: '/app/pipelines' },
  { label: 'Create new pipeline' },
  ...(builderStep.value === 'details'
    ? [{ label: 'Design', to: '/app/pipelines/new?step=design' }, { label: 'Details' }]
    : [{ label: 'Design' }]),
])

function updateDesignSteps(steps: PipelineActivityStepRequest[]) {
  designSteps.value = steps
}

function updateDesignValidity(valid: boolean, message: string) {
  designValid.value = valid
  designHint.value = message
}

function handleDesignChange() {
  designDraft.value = designEditor.value?.getDraft() ?? null
  saveLocalDraft()
}

function saveLocalDraft() {
  if (!import.meta.client) return
  localStorage.setItem(localKey, JSON.stringify({
    design: designEditor.value?.getDraft() ?? designDraft.value,
    title: pipelineTitle.value,
    description: pipelineDescription.value,
    step: builderStep.value,
    updatedAt: new Date().toISOString(),
  }))
}

async function saveDesign() {
  if (!designValid.value) return
  saveError.value = ''
  builderStep.value = 'details'
  saveLocalDraft()
  await router.replace({ query: { ...route.query, step: 'details' } })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function validateDetails() {
  detailErrors.title = pipelineTitle.value.trim() ? '' : 'Give this pipeline a title.'
  detailErrors.description = pipelineDescription.value.trim() ? '' : 'Describe what this pipeline does.'
  return !detailErrors.title && !detailErrors.description
}

async function createPipeline() {
  if (!validateDetails() || !designValid.value || savingPipeline.value) return
  savingPipeline.value = true
  saveError.value = ''
  try {
    await api.pipelines.create({
      name: pipelineTitle.value.trim(),
      description: pipelineDescription.value.trim(),
      steps: designEditor.value?.getSteps() ?? designSteps.value,
    })
    localStorage.removeItem(localKey)
    clearNuxtData('pipelines-catalog')
    allowRouteLeave.value = true
    await router.push('/app/pipelines')
  } catch (cause) {
    saveError.value = apiErrorMessage(cause, 'The pipeline could not be saved. Please try again.')
    saveLocalDraft()
  } finally {
    savingPipeline.value = false
  }
}

function restoreLocalDraft() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(localKey)
  if (!raw) return
  try {
    const draft = JSON.parse(raw) as Record<string, unknown>
    pipelineTitle.value = typeof draft.title === 'string' ? draft.title : ''
    pipelineDescription.value = typeof draft.description === 'string' ? draft.description : ''
    const design = draft.design && typeof draft.design === 'object'
      ? draft.design as Partial<PipelineDesignDraft>
      : { activities: draft.activities, localLoops: draft.localLoops }
    if (Array.isArray(design.activities) && Array.isArray(design.localLoops)) {
      designDraft.value = design as PipelineDesignDraft
      designEditor.value?.restoreDraft(designDraft.value)
    }
    if (route.query.step !== 'design' && route.query.step !== 'details' && draft.step === 'details') {
      builderStep.value = 'details'
    }
  } catch {
    localStorage.removeItem(localKey)
  }
}

async function leaveBuilder() {
  allowRouteLeave.value = true
  exitModalOpen.value = false
  await router.push(pendingDestination.value)
}

async function saveDraftAndLeave() {
  if (exitActionPending.value) return
  exitActionPending.value = true
  try {
    saveLocalDraft()
    await leaveBuilder()
  } finally {
    exitActionPending.value = false
  }
}

async function discardDraftAndLeave() {
  if (exitActionPending.value) return
  exitActionPending.value = true
  try {
    localStorage.removeItem(localKey)
    await leaveBuilder()
  } finally {
    exitActionPending.value = false
  }
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasProgress.value || allowRouteLeave.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave((to) => {
  if (allowRouteLeave.value || to.path === route.path || !hasProgress.value) return true
  pendingDestination.value = to.fullPath
  exitModalOpen.value = true
  return false
})

watch(() => route.query.step, async (requestedStep) => {
  if (requestedStep === 'design') {
    builderStep.value = 'design'
    return
  }
  if (requestedStep === 'details') {
    if (designValid.value) builderStep.value = 'details'
    else await router.replace({ query: { ...route.query, step: 'design' } })
  }
})

onMounted(async () => {
  restoreLocalDraft()
  await nextTick()
  if (builderStep.value === 'details' && !designValid.value) {
    builderStep.value = 'design'
    await router.replace({ query: { ...route.query, step: 'design' } })
  }
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

definePageMeta({ layout: 'app' })
useHead({ title: 'Create a pipeline · Looping Louie' })
</script>

<template>
  <WizardShell :steps="builderSteps" :current="builderStepIndex" class="pipeline-builder">
    <UiBreadcrumb :items="breadcrumbItems" class="pipeline-builder__breadcrumb" />

    <UiHeadingBlock layout="split" size="section" align="start" class="pipeline-builder__heading">
      <template #title>
        <h1>{{ builderStep === 'design' ? 'Build a new pipeline' : 'Name your pipeline' }}</h1>
      </template>
      <template #description>
        <p v-if="builderStep === 'design'">Connect existing loops into one clear, repeatable workflow.</p>
        <p v-else>Give your design a clear title and a short description so your team can find it later.</p>
      </template>
      <template #aside>
        <div class="pipeline-builder__heading-actions">
          <UiButton v-if="builderStep === 'design'" :disabled="!designValid" @click="saveDesign">Save design</UiButton>
          <UiButton v-else :disabled="!canSavePipeline" :loading="savingPipeline" @click="createPipeline">Save pipeline</UiButton>
          <p v-if="builderStep === 'design' && designHint" class="pipeline-builder__design-hint">{{ designHint }}</p>
          <p v-if="saveError" class="pipeline-builder__save-error" role="alert">{{ saveError }}</p>
        </div>
      </template>
    </UiHeadingBlock>

    <PipelineDesignEditor
      v-if="builderStep === 'design'"
      ref="designEditor"
      :initial-steps="designSteps"
      @update:steps="updateDesignSteps"
      @validity-change="updateDesignValidity"
      @change="handleDesignChange"
    />

    <section v-else class="pipeline-builder__details" aria-label="Pipeline details">
      <div class="pipeline-builder__field-stage">
        <UiCollectionGroupTitle title="Title *" heading-as="h2" />
        <UiSectionStage inverse="bottom">
          <UiTextField
            v-model="pipelineTitle"
            label="Title"
            hide-label
            required
            placeholder="e.g. Review and approve a launch plan"
            :error="detailErrors.title"
            @input="detailErrors.title = ''; saveError = ''"
          />
        </UiSectionStage>
      </div>
      <div class="pipeline-builder__field-stage">
        <UiCollectionGroupTitle title="Description *" heading-as="h2" />
        <UiSectionStage inverse="bottom">
          <UiTextField
            v-model="pipelineDescription"
            label="Description"
            hide-label
            multiline
            :rows="7"
            required
            placeholder="Explain what this pipeline coordinates and when your team should use it…"
            :error="detailErrors.description"
            @input="detailErrors.description = ''; saveError = ''"
          />
        </UiSectionStage>
      </div>
    </section>

    <UiModal
      v-model:open="exitModalOpen"
      title="Leave this pipeline unfinished?"
      description="Save your progress as a draft so you can continue later, or discard it permanently."
      :close-on-backdrop="!exitActionPending"
      :show-close="!exitActionPending"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
        </svg>
      </template>
      <template #actions>
        <UiButton variant="coral" :disabled="exitActionPending" @click="discardDraftAndLeave">Discard draft</UiButton>
        <UiButton data-autofocus :loading="exitActionPending" @click="saveDraftAndLeave">Save draft</UiButton>
      </template>
    </UiModal>
  </WizardShell>
</template>

<style scoped>
.pipeline-builder { --layout-wizard-shell-padding-end: 0; }
.pipeline-builder__breadcrumb { margin-bottom: var(--ll-space-5); }
.pipeline-builder__heading { margin-bottom: var(--ll-space-10); }
.pipeline-builder__heading-actions { display: grid; max-width: 22rem; justify-items: end; gap: var(--ll-space-3); }
.pipeline-builder__save-error { margin: 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control); text-align: right; }
.pipeline-builder__design-hint { margin: 0; color: var(--ll-color-text-muted); font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control); text-align: right; }
.pipeline-builder__details { display: grid; gap: var(--ll-space-6); padding-bottom: var(--ll-space-12); }
.pipeline-builder__field-stage { min-width: 0; }
.pipeline-builder__field-stage :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }
@media (max-width: 48rem) {
  .pipeline-builder__heading { margin-bottom: var(--ll-space-8); }
  .pipeline-builder__heading-actions { width: 100%; max-width: none; justify-items: start; }
  .pipeline-builder__save-error,
  .pipeline-builder__design-hint { text-align: left; }
}
</style>
