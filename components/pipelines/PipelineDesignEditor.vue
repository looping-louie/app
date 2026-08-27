<script lang="ts">
import type { ActivityLoopAgentInput, ActivityLoopFlow, ActivityLoopOutputContract, ActivityLoopStopConditions, ExecutionHarness } from '~/types/api'

export interface PipelineDesignDraft {
  activities: PipelineEditorActivity[]
  localLoops: PipelineEditorLoop[]
}

export interface PipelineEditorLoop {
  id: string
  title: string
  description: string
  flow: ActivityLoopFlow
  status: string
  agents: ActivityLoopAgentInput[]
  model_id?: string | null
  harness?: ExecutionHarness | null
  stop_conditions: ActivityLoopStopConditions
  output_contract?: ActivityLoopOutputContract
}

export interface PipelineEditorLoopActivity {
  instanceId: string
  type: 'loop'
  loopId: string
}

export interface PipelineEditorHumanGateActivity {
  instanceId: string
  type: 'human-gate'
  gate: 'human-review' | 'multiple-choice-quiz'
}

export type PipelineEditorActivity = PipelineEditorLoopActivity | PipelineEditorHumanGateActivity
</script>

<script setup lang="ts">
import PipelineCanvas from '~/components/pipelines/PipelineCanvas.vue'
import type { PipelineCanvasActivity } from '~/components/pipelines/PipelineCanvas.vue'
import PipelineLoopDrawer from '~/components/pipelines/PipelineLoopDrawer.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import type {
  ActivityCreateRequest,
  ActivityLoopConfig,
  ActivityLoopType,
  PipelineActivityStepRequest,
  PipelineActivityStepResponse,
} from '~/types/api'

interface CommandPaletteItem {
  id: string
  label: string
  group?: string
  keywords?: string[]
  description?: string
  iconPath?: string
}

type HumanGateKind = PipelineEditorHumanGateActivity['gate']
type InitialStep = PipelineActivityStepRequest | PipelineActivityStepResponse

const props = withDefaults(defineProps<{
  initialSteps?: InitialStep[]
  title?: string
  showTitle?: boolean
  useStage?: boolean
  inheritedModelId?: string | null
  inheritedHarness?: ExecutionHarness | null
}>(), {
  initialSteps: () => [],
  title: 'Your pipeline',
  showTitle: true,
  useStage: true,
  inheritedModelId: null,
  inheritedHarness: null,
})

const emit = defineEmits<{
  'update:steps': [steps: PipelineActivityStepRequest[]]
  'validity-change': [valid: boolean, message: string]
  change: []
}>()

const humanGates: Array<{
  id: HumanGateKind
  title: string
  description: string
  iconPath: string
}> = [
  {
    id: 'human-review',
    title: 'Human review',
    description: 'Pause for one person to inspect and approve the result.',
    iconPath: 'M144,157.68a68,68,0,1,0-71.9,0c-20.65,6.76-39.23,19.39-54.17,37.17a8,8,0,0,0,12.25,10.3C50.25,181.19,77.91,168,108,168s57.75,13.19,77.87,37.15a8,8,0,0,0,12.25-10.3C183.18,177.07,164.6,164.44,144,157.68ZM56,100a52,52,0,1,1,52,52A52.06,52.06,0,0,1,56,100Zm197.66,33.66-32,32a8,8,0,0,1-11.32,0l-16-16a8,8,0,0,1,11.32-11.32L216,148.69l26.34-26.35a8,8,0,0,1,11.32,11.32Z',
  },
  {
    id: 'multiple-choice-quiz',
    title: 'Quiz review',
    description: 'Pause for a person to record a single pass or fail decision.',
    iconPath: 'M216,40H40A16,16,0,0,0,24,56V216a8,8,0,0,0,11.58,7.16L64,208.94l28.42,14.22a8,8,0,0,0,7.16,0L128,208.94l28.42,14.22a8,8,0,0,0,7.16,0L192,208.94l28.42,14.22A8,8,0,0,0,232,216V56A16,16,0,0,0,216,40Zm0,163.06-20.42-10.22a8,8,0,0,0-7.16,0L160,207.06l-28.42-14.22a8,8,0,0,0-7.16,0L96,207.06,67.58,192.84a8,8,0,0,0-7.16,0L40,203.06V56H216ZM60.42,167.16a8,8,0,0,0,10.74-3.58L76.94,152h38.12l5.78,11.58a8,8,0,1,0,14.32-7.16l-32-64a8,8,0,0,0-14.32,0l-32,64A8,8,0,0,0,60.42,167.16ZM96,113.89,107.06,136H84.94ZM136,128a8,8,0,0,1,8-8h16V104a8,8,0,0,1,16,0v16h16a8,8,0,0,1,0,16H176v16a8,8,0,0,1-16,0V136H144A8,8,0,0,1,136,128Z',
  },
]

const api = useApiClient()
const stageRoot = ref<HTMLElement | null>(null)
const paletteOpen = ref(false)
const paletteQuery = ref('')
const loopDrawerOpen = ref(false)
const editingLoopId = ref<string | null>(null)
const localLoops = ref<PipelineEditorLoop[]>([])
const activities = ref<PipelineEditorActivity[]>([])
let stageResizeObserver: ResizeObserver | undefined

const { data: loopOptionsData, status: loopOptionsStatus } = await useAsyncData(
  'pipeline-design-editor-options',
  async () => {
    const [personas, models] = await Promise.all([
      api.personas.list({ status: 'enabled' }),
      api.models.list({ available: true, sort: 'alphabetical-asc' }),
    ])
    return { personas: personas.items, models: models.items }
  },
)

const loopById = computed(() => new Map(localLoops.value.map(loop => [loop.id, loop])))
const editingLoop = computed(() => editingLoopId.value ? loopById.value.get(editingLoopId.value) ?? null : null)
const gateById = new Map(humanGates.map(gate => [gate.id, gate]))
const canvasActivities = computed<PipelineCanvasActivity[]>(() => {
  const result: PipelineCanvasActivity[] = []
  for (const activity of activities.value) {
    if (activity.type === 'loop') {
      const loop = loopById.value.get(activity.loopId)
      if (loop) result.push({ instanceId: activity.instanceId, type: 'loop', loop })
      continue
    }
    const gate = gateById.get(activity.gate)
    if (!gate) continue
    result.push({
      instanceId: activity.instanceId,
      type: 'human-gate',
      gate: activity.gate,
      title: gate.title,
    })
  }
  return result
})

const hasLoop = computed(() => activities.value.some(activity => activity.type === 'loop'))
const valid = computed(() => (
  hasLoop.value
  && activities.value.length >= 2
  && localLoops.value.every(loop => (
    Boolean(loop.flow)
    && Boolean(loop.stop_conditions?.max_iterations || loop.stop_conditions?.max_tokens || loop.stop_conditions?.timeout_seconds)
    && loop.agents.length > 0
    && loop.agents.every(agent => Boolean(agent.persona_id && agent.role))
  ))
))
const validationMessage = computed(() => {
  if (!hasLoop.value) return ''
  if (activities.value.length < 2) return 'Add one more step to complete the design.'
  if (!valid.value) return 'Complete every loop configuration before continuing.'
  return ''
})

const paletteItems = computed<CommandPaletteItem[]>(() => {
  return humanGates.map(gate => ({
    id: gate.id,
    label: gate.title,
    description: gate.description,
    group: 'Human gates',
    iconPath: gate.iconPath,
    keywords: ['gate', 'approval', 'review'],
  }))
})

const palettePresentation = {
  placeholder: 'Choose a human gate…',
  ariaLabel: 'Add a human gate to your pipeline',
  emptyTitle: 'No human gates found',
  emptyDescription: 'There are no matching options.',
}

function createInstanceId(prefix = 'activity-') {
  if (import.meta.client && typeof crypto.randomUUID === 'function') return `${prefix}${crypto.randomUUID()}`
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function activityRequest(activity: PipelineEditorActivity): ActivityCreateRequest {
  if (activity.type === 'loop') {
    const loop = loopById.value.get(activity.loopId)
    if (!loop) throw new Error(`Loop ${activity.loopId} is no longer available.`)
    const type: ActivityLoopType = `${loop.flow}_loop`
    return {
      name: loop.title,
      description: loop.description,
      type,
      model_id: loop.model_id ?? null,
      harness: loop.harness ?? null,
      config: {
        agents: loop.agents.map(({ persona_id, role, model_id }) => ({ persona_id, role, model_id })),
        stop_conditions: loop.stop_conditions,
        output_contract: loop.output_contract ?? {
          type: 'text',
          description: 'Return the completed result as text.',
          files: [],
          schema: null,
        },
      },
    }
  }

  const gate = gateById.get(activity.gate)
  if (!gate) throw new Error('This human gate is no longer available.')
  if (activity.gate === 'multiple-choice-quiz') return {
    name: gate.title,
    description: gate.description,
    type: 'quiz',
    config: { quiz: {} },
  }
  return { name: gate.title, description: gate.description, type: 'approval', config: {} }
}

function getSteps(): PipelineActivityStepRequest[] {
  const usedNames = new Set<string>()
  const requests = activities.value.map((activity) => {
    const request = activityRequest(activity)
    let name = request.name
    let suffix = 2
    while (usedNames.has(name)) {
      name = `${request.name} ${suffix}`
      suffix += 1
    }
    usedNames.add(name)
    return { ...request, name }
  })
  return requests.map((request, index) => ({
    ...request,
    dependsOn: index === 0 ? [] : [{ activity: requests[index - 1]!.name, condition: 'success' }],
  }))
}

function getDraft(): PipelineDesignDraft {
  return {
    activities: cloneValue(activities.value),
    localLoops: cloneValue(localLoops.value),
  }
}

function sync({ changed = true } = {}) {
  emit('update:steps', getSteps())
  emit('validity-change', valid.value, validationMessage.value)
  if (changed) emit('change')
}

function replaceSteps(steps: InitialStep[]) {
  localLoops.value = []
  activities.value = []
  steps.forEach((step, index) => {
    const instanceId = createInstanceId('persisted-step-')
    if (step.type.endsWith('_loop')) {
      const config = step.config as ActivityLoopConfig
      const loopId = createInstanceId('persisted-loop-')
      localLoops.value.push({
        id: loopId,
        title: step.name,
        description: step.description,
        flow: step.type.replace('_loop', '') as PipelineEditorLoop['flow'],
        status: 'active',
        agents: cloneValue(config.agents),
        model_id: step.model_id,
        harness: step.harness,
        stop_conditions: cloneValue(config.stop_conditions),
        output_contract: cloneValue(config.output_contract),
      })
      activities.value.push({ instanceId, type: 'loop', loopId })
      return
    }

    const isQuiz = step.type === 'quiz'
    activities.value.push({
      instanceId,
      type: 'human-gate',
      gate: isQuiz ? 'multiple-choice-quiz' : 'human-review',
    })
  })
  nextTick(() => {
    measureStage()
    sync({ changed: false })
  })
}

function restoreDraft(draft: PipelineDesignDraft) {
  localLoops.value = cloneValue(draft.localLoops)
  activities.value = cloneValue(draft.activities).map(activity => activity.type === 'loop'
    ? activity
    : {
        instanceId: activity.instanceId,
        type: 'human-gate',
        gate: activity.gate === 'multiple-choice-quiz' ? 'multiple-choice-quiz' : 'human-review',
      })
  nextTick(() => {
    measureStage()
    sync({ changed: false })
  })
}

function openLoopDrawer() {
  editingLoopId.value = null
  loopDrawerOpen.value = true
}

function editLoop(instanceId: string) {
  const activity = activities.value.find(candidate => candidate.instanceId === instanceId)
  if (activity?.type !== 'loop' || !loopById.value.has(activity.loopId)) return
  editingLoopId.value = activity.loopId
  loopDrawerOpen.value = true
}

function openHumanGatePalette() {
  paletteQuery.value = ''
  paletteOpen.value = true
}

function selectPaletteItem(item: CommandPaletteItem) {
  if (!gateById.has(item.id as HumanGateKind)) return
  const gate = item.id as HumanGateKind
  activities.value.push({
    instanceId: createInstanceId(),
    type: 'human-gate',
    gate,
  })
  nextTick(measureStage)
  sync()
}

function addLocalLoop(loop: PipelineEditorLoop) {
  localLoops.value.push(loop)
  activities.value.push({ instanceId: createInstanceId(), type: 'loop', loopId: loop.id })
  nextTick(measureStage)
  sync()
}

function updateLocalLoop(loop: PipelineEditorLoop) {
  const index = localLoops.value.findIndex(candidate => candidate.id === loop.id)
  if (index < 0) return
  localLoops.value[index] = { ...localLoops.value[index]!, ...loop }
  editingLoopId.value = null
  sync()
}

function removeActivity(instanceId: string) {
  activities.value = activities.value.filter(activity => activity.instanceId !== instanceId)
  nextTick(measureStage)
  sync()
}

function swapActivities(sourceId: string, targetId: string) {
  if (sourceId === targetId) return
  const sourceIndex = activities.value.findIndex(activity => activity.instanceId === sourceId)
  const targetIndex = activities.value.findIndex(activity => activity.instanceId === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return
  const reordered = [...activities.value]
  const source = reordered[sourceIndex]!
  reordered[sourceIndex] = reordered[targetIndex]!
  reordered[targetIndex] = source
  activities.value = reordered
  sync()
}

function measureStage() {
  if (!import.meta.client || !stageRoot.value) return
  const shell = stageRoot.value.querySelector<HTMLElement>('.ui-section-stage__shell')
  if (!shell) return
  const remainingHeight = Math.max(400, window.innerHeight - shell.getBoundingClientRect().top)
  stageRoot.value.style.setProperty('--pipeline-stage-min-height', `${remainingHeight}px`)
}

replaceSteps(props.initialSteps)

onMounted(() => {
  window.addEventListener('resize', measureStage)
  stageResizeObserver = new ResizeObserver(measureStage)
  if (stageRoot.value) stageResizeObserver.observe(stageRoot.value)
  nextTick(measureStage)
})

onBeforeUnmount(() => {
  stageResizeObserver?.disconnect()
  window.removeEventListener('resize', measureStage)
})

defineExpose({ getDraft, getSteps, restoreDraft })
</script>

<template>
  <div ref="stageRoot" class="pipeline-design-editor">
    <UiCollectionGroupTitle v-if="showTitle" :title="title" heading-as="h2" />
    <UiSectionStage v-if="useStage" inverse="bottom">
      <PipelineCanvas
        :activities="canvasActivities"
        @add-loop="openLoopDrawer"
        @add-human-gate="openHumanGatePalette"
        @edit-loop="editLoop"
        @remove="removeActivity"
        @move="swapActivities"
      />
    </UiSectionStage>
    <PipelineCanvas
      v-else
      :activities="canvasActivities"
      @add-loop="openLoopDrawer"
      @add-human-gate="openHumanGatePalette"
      @edit-loop="editLoop"
      @remove="removeActivity"
      @move="swapActivities"
    />
  </div>

  <PipelineLoopDrawer
    v-model:open="loopDrawerOpen"
    :loop="editingLoop"
    :personas="loopOptionsData?.personas ?? []"
    :models="loopOptionsData?.models ?? []"
    :inherited-model-id="inheritedModelId"
    :inherited-harness="inheritedHarness"
    :loading="loopOptionsStatus === 'pending'"
    @add="addLocalLoop"
    @update="updateLocalLoop"
  />

  <UiCommandPalette
    v-model:open="paletteOpen"
    v-model:query="paletteQuery"
    :items="paletteItems"
    option-style="card"
    :placeholder="palettePresentation.placeholder"
    :aria-label="palettePresentation.ariaLabel"
    :empty-title="palettePresentation.emptyTitle"
    :empty-description="palettePresentation.emptyDescription"
    @select="selectPaletteItem"
  >
    <template #item="{ item }">
      <span class="pipeline-design-editor__option">
        <span class="pipeline-design-editor__option-icon" aria-hidden="true">
          <svg viewBox="0 0 256 256" fill="currentColor"><path :d="item.iconPath" /></svg>
        </span>
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </span>
      </span>
    </template>
  </UiCommandPalette>
</template>

<style scoped>
.pipeline-design-editor { --pipeline-stage-min-height: 28rem; }
.pipeline-design-editor :deep(.ui-section-stage__shell) { width: 100%; min-height: var(--pipeline-stage-min-height); margin-inline: 0; }
.pipeline-design-editor :deep(.ui-section-stage__content) { display: flex; min-height: var(--pipeline-stage-min-height); box-sizing: border-box; align-items: stretch; }
.pipeline-design-editor__option { display: flex; width: 100%; min-width: 0; align-items: center; gap: var(--ll-space-3); }
.pipeline-design-editor__option-icon { display: grid; width: 2.75rem; height: 2.75rem; flex: none; box-sizing: border-box; place-items: center; color: var(--ll-color-ink); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: 50%; }
.pipeline-design-editor__option-icon svg { width: 1.15rem; height: 1.15rem; }
.pipeline-design-editor__option > span:last-child { display: grid; min-width: 0; gap: 0.2rem; }
.pipeline-design-editor__option strong { color: var(--ll-color-ink); font: 600 var(--ll-text-sm) / 1.25 var(--ll-font-control); }
.pipeline-design-editor__option small { overflow: hidden; color: var(--ll-color-text-muted); font: 400 var(--ll-text-xs) / 1.35 var(--ll-font-control); text-overflow: ellipsis; white-space: nowrap; }
</style>
