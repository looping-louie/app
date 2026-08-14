<script setup lang="ts">
import PipelineCanvas from '~/components/pipelines/PipelineCanvas.vue'
import type { PipelineCanvasActivity } from '~/components/pipelines/PipelineCanvas.vue'
import PipelineLoopDrawer from '~/components/pipelines/PipelineLoopDrawer.vue'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiFormProgress from '~/components/ui/FormProgress.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type {
  ActivityCreateRequest,
  LoopAgentInput,
  LoopActivityType,
  LoopFlow,
  LoopOutputContract,
  LoopRole,
  LoopStopConditions,
  PipelineActivityStepRequest,
} from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

interface LoopSummary {
  id: string
  title: string
  description: string
  flow: LoopFlow
  status: string
  agents: LoopAgentInput[]
  stop_conditions: LoopStopConditions
  output_contract?: LoopOutputContract
}

interface CommandPaletteItem {
  id: string
  label: string
  group?: string
  keywords?: string[]
  description?: string
  iconPath?: string
}

type HumanGateKind = 'human-review' | 'four-eye-review' | 'multiple-choice-quiz'

interface PipelineLoopActivity {
  instanceId: string
  type: 'loop'
  loopId: string
}

interface PipelineHumanGateActivity {
  instanceId: string
  type: 'human-gate'
  gate: HumanGateKind
  teamMembers?: Array<'any-person' | null>
  passingScore?: number | null
}

type PipelineActivity = PipelineLoopActivity | PipelineHumanGateActivity
type PipelineBuilderStep = 'design' | 'details'

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
    id: 'four-eye-review',
    title: '4-eye review',
    description: 'Require a second pair of eyes before the pipeline continues.',
    iconPath: 'M176,32c-20.61,0-38.28,18.16-48,45.85C118.28,50.16,100.61,32,80,32c-31.4,0-56,42.17-56,96s24.6,96,56,96c20.61,0,38.28-18.16,48-45.85,9.72,27.69,27.39,45.85,48,45.85,31.4,0,56-42.17,56-96S207.4,32,176,32ZM106.92,186.39C99.43,200.12,89.62,208,80,208s-19.43-7.88-26.92-21.61a104.81,104.81,0,0,1-10.24-29.23,32,32,0,1,0,0-58.32A104.81,104.81,0,0,1,53.08,69.61C60.57,55.88,70.38,48,80,48s19.43,7.88,26.92,21.61C115.35,85.07,120,105.81,120,128S115.35,170.93,106.92,186.39ZM40,128a16,16,0,1,1,16,16A16,16,0,0,1,40,128Zm162.92,58.39C195.43,200.12,185.62,208,176,208s-19.43-7.88-26.92-21.61a104.81,104.81,0,0,1-10.24-29.23,32,32,0,1,0,0-58.32,104.81,104.81,0,0,1,10.24-29.23C156.57,55.88,166.38,48,176,48s19.43,7.88,26.92,21.61C211.35,85.07,216,105.81,216,128S211.35,170.93,202.92,186.39ZM136,128a16,16,0,1,1,16,16A16,16,0,0,1,136,128Z',
  },
  {
    id: 'multiple-choice-quiz',
    title: 'Multiple-choice quiz',
    description: 'Ask a structured question and continue with the chosen answer.',
    iconPath: 'M216,40H40A16,16,0,0,0,24,56V216a8,8,0,0,0,11.58,7.16L64,208.94l28.42,14.22a8,8,0,0,0,7.16,0L128,208.94l28.42,14.22a8,8,0,0,0,7.16,0L192,208.94l28.42,14.22A8,8,0,0,0,232,216V56A16,16,0,0,0,216,40Zm0,163.06-20.42-10.22a8,8,0,0,0-7.16,0L160,207.06l-28.42-14.22a8,8,0,0,0-7.16,0L96,207.06,67.58,192.84a8,8,0,0,0-7.16,0L40,203.06V56H216ZM60.42,167.16a8,8,0,0,0,10.74-3.58L76.94,152h38.12l5.78,11.58a8,8,0,1,0,14.32-7.16l-32-64a8,8,0,0,0-14.32,0l-32,64A8,8,0,0,0,60.42,167.16ZM96,113.89,107.06,136H84.94ZM136,128a8,8,0,0,1,8-8h16V104a8,8,0,0,1,16,0v16h16a8,8,0,0,1,0,16H176v16a8,8,0,0,1-16,0V136H144A8,8,0,0,1,136,128Z',
  },
]

const route = useRoute()
const router = useRouter()
const builderSteps = ['Design', 'Details']
const builderStep = ref<PipelineBuilderStep>(route.query.step === 'details' ? 'details' : 'design')
const pipelineTitle = ref('')
const pipelineDescription = ref('')
const detailErrors = reactive({ title: '', description: '' })
const savingPipeline = ref(false)
const saveError = ref('')
const stageRoot = ref<HTMLElement | null>(null)
const paletteOpen = ref(false)
const paletteQuery = ref('')
const paletteKind = ref<'human-gates' | 'users'>('human-gates')
const loopDrawerOpen = ref(false)
const localLoops = ref<LoopSummary[]>([])
const activities = ref<PipelineActivity[]>([])
const memberSelectionTarget = ref<{ instanceId: string, slotIndex: number } | null>(null)
const exitModalOpen = ref(false)
const exitActionPending = ref(false)
const allowRouteLeave = ref(false)
const pendingDestination = ref('/app/pipelines')
const localKey = 'looping-louie:pipeline-builder-draft:v1'
const api = useApiClient()
let stageResizeObserver: ResizeObserver | undefined

const { data } = await useAsyncData(
  'pipeline-builder-loops',
  () => api.loops.list({ offset: 0 }),
)

const { data: loopOptionsData, status: loopOptionsStatus } = await useAsyncData(
  'pipeline-builder-loop-options',
  async () => {
    const [personas, models] = await Promise.all([
      api.personas.list(),
      api.models.list({ available: true }),
    ])
    return { personas: personas.items, models: models.items }
  },
)

const loops = computed(() => [...localLoops.value, ...(data.value?.items ?? [])])
const loopById = computed(() => new Map(loops.value.map(loop => [loop.id, loop])))
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
      teamMembers: activity.teamMembers,
      passingScore: activity.passingScore,
    })
  }
  return result
})
const hasProgress = computed(() => Boolean(
  activities.value.length
  || pipelineTitle.value.trim()
  || pipelineDescription.value.trim(),
))
const hasLoop = computed(() => activities.value.some(activity => activity.type === 'loop'))
const builderStepIndex = computed(() => builderStep.value === 'design' ? 0 : 1)
const hasConfiguredQuiz = computed(() => activities.value.every(activity => (
  activity.type !== 'human-gate'
  || activity.gate !== 'multiple-choice-quiz'
  || (typeof activity.passingScore === 'number' && activity.passingScore >= 1 && activity.passingScore <= 10)
)))
const hasCompleteLocalLoops = computed(() => localLoops.value.every(loop => (
  Boolean(loop.flow)
  && Boolean(loop.stop_conditions?.max_iterations || loop.stop_conditions?.max_tokens || loop.stop_conditions?.timeout_seconds)
  && loop.agents.length > 0
  && loop.agents.every(agent => Boolean(agent.persona_id && agent.model_id && agent.role))
)))
const canSaveDesign = computed(() => (
  hasLoop.value
  && activities.value.length >= 2
  && hasConfiguredQuiz.value
  && hasCompleteLocalLoops.value
))
const canSavePipeline = computed(() => (
  canSaveDesign.value
  && Boolean(pipelineTitle.value.trim())
  && Boolean(pipelineDescription.value.trim())
  && !savingPipeline.value
))
const designHint = computed(() => {
  if (!hasLoop.value) return ''
  if (activities.value.length < 2) return 'Add one more step to complete the design.'
  if (!hasConfiguredQuiz.value) return 'Set a passing score for every quiz.'
  if (!hasCompleteLocalLoops.value) return 'Complete every loop configuration before continuing.'
  return ''
})
const breadcrumbItems = computed(() => [
  { label: 'Pipelines', to: '/app/pipelines' },
  { label: 'Create new pipeline' },
  ...(builderStep.value === 'details'
    ? [{ label: 'Design', to: '/app/pipelines/new?step=design' }, { label: 'Details' }]
    : [{ label: 'Design' }]),
])

const paletteItems = computed<CommandPaletteItem[]>(() => {
  if (paletteKind.value === 'users') {
    return [{
      id: 'any-person',
      label: 'Any person',
      description: 'Let any available person complete this review.',
      group: 'People',
      keywords: ['anyone', 'reviewer', 'member'],
      iconPath: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,48c-10.29,17.79-27.4,28-46.93,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.07-20a8,8,0,0,1,13.86,8Z',
    }]
  }

  if (paletteKind.value === 'human-gates') {
    return humanGates.map(gate => ({
      id: gate.id,
      label: gate.title,
      description: gate.description,
      group: 'Human gates',
      iconPath: gate.iconPath,
      keywords: ['gate', 'approval', 'review'],
    }))
  }

  return []
})

const palettePresentation = computed(() => {
  if (paletteKind.value === 'users') {
    return {
      size: 'default' as const,
      placeholder: 'Search people…',
      ariaLabel: 'Choose a team member',
      emptyTitle: 'No people found',
      emptyDescription: 'There are no matching people.',
    }
  }
  if (paletteKind.value === 'human-gates') {
    return {
      size: 'default' as const,
      placeholder: 'Choose a human gate…',
      ariaLabel: 'Add a human gate to your pipeline',
      emptyTitle: 'No human gates found',
      emptyDescription: 'There are no matching options.',
    }
  }
  return {
    size: 'default' as const,
    placeholder: 'Choose a human gate…',
    ariaLabel: 'Add a human gate to your pipeline',
    emptyTitle: 'No human gates found',
    emptyDescription: 'There are no matching options.',
  }
})

function createInstanceId() {
  if (import.meta.client && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function openLoopDrawer() {
  memberSelectionTarget.value = null
  loopDrawerOpen.value = true
}

function openHumanGatePalette() {
  memberSelectionTarget.value = null
  paletteKind.value = 'human-gates'
  paletteQuery.value = ''
  paletteOpen.value = true
}

function openMemberPalette(instanceId: string, slotIndex: number) {
  memberSelectionTarget.value = { instanceId, slotIndex }
  paletteKind.value = 'users'
  paletteQuery.value = ''
  paletteOpen.value = true
}

function selectPaletteItem(item: CommandPaletteItem) {
  if (paletteKind.value === 'users') {
    const target = memberSelectionTarget.value
    const activity = target
      ? activities.value.find(candidate => candidate.instanceId === target.instanceId)
      : undefined
    if (!target || item.id !== 'any-person' || activity?.type !== 'human-gate' || activity.gate === 'multiple-choice-quiz') return

    const slotCount = activity.gate === 'four-eye-review' ? 2 : 1
    const members = Array.from({ length: slotCount }, (_, index) => activity.teamMembers?.[index] ?? null)
    members[target.slotIndex] = 'any-person'
    activity.teamMembers = members
    memberSelectionTarget.value = null
  } else if (paletteKind.value === 'human-gates') {
    if (!gateById.has(item.id as HumanGateKind)) return
    const gate = item.id as HumanGateKind
    activities.value.push({
      instanceId: createInstanceId(),
      type: 'human-gate',
      gate,
      ...(gate === 'human-review' ? { teamMembers: [null] } : {}),
      ...(gate === 'four-eye-review' ? { teamMembers: [null, null] } : {}),
      ...(gate === 'multiple-choice-quiz' ? { passingScore: null } : {}),
    })
  }
  nextTick(measureStage)
}

function addLocalLoop(loop: LoopSummary) {
  localLoops.value.push(loop)
  activities.value.push({
    instanceId: createInstanceId(),
    type: 'loop',
    loopId: loop.id,
  })
  nextTick(measureStage)
}

function updatePassingScore(instanceId: string, value: number | null) {
  const activity = activities.value.find(candidate => candidate.instanceId === instanceId)
  if (activity?.type !== 'human-gate' || activity.gate !== 'multiple-choice-quiz') return
  activity.passingScore = value
}

function removeActivity(instanceId: string) {
  activities.value = activities.value.filter(activity => activity.instanceId !== instanceId)
  nextTick(measureStage)
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
}


function measureStage() {
  if (!import.meta.client || !stageRoot.value) return
  const shell = stageRoot.value.querySelector<HTMLElement>('.ui-section-stage__shell')
  if (!shell) return
  const remainingHeight = Math.max(400, window.innerHeight - shell.getBoundingClientRect().top)
  stageRoot.value.style.setProperty('--pipeline-stage-min-height', `${remainingHeight}px`)
}

function saveLocalDraft() {
  if (!import.meta.client) return
  localStorage.setItem(localKey, JSON.stringify({
    activities: activities.value,
    localLoops: localLoops.value,
    title: pipelineTitle.value,
    description: pipelineDescription.value,
    step: builderStep.value,
    updatedAt: new Date().toISOString(),
  }))
}

async function saveDesign() {
  if (!canSaveDesign.value) return
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

function activityRequest(activity: PipelineActivity): ActivityCreateRequest {
  if (activity.type === 'loop') {
    const loop = loopById.value.get(activity.loopId)
    if (!loop) throw new Error(`Loop ${activity.loopId} is no longer available.`)
    const type: LoopActivityType = `${loop.flow}_loop`
    return {
      name: loop.title,
      description: loop.description,
      type,
      config: {
        agents: loop.agents,
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
  if (activity.gate === 'multiple-choice-quiz') {
    return {
      name: gate.title,
      description: gate.description,
      type: 'quiz',
      config: {
        quiz: {
          minimum_correct_answers: activity.passingScore!,
          question_count: 10,
          option_count: 3,
        },
      },
    }
  }
  return {
    name: gate.title,
    description: gate.description,
    type: 'approval',
    config: {},
  }
}

function pipelineStepRequests(): PipelineActivityStepRequest[] {
  const usedNames = new Set<string>()
  const requests = activities.value.map((activity) => {
    const request = activityRequest(activity)
    // Dependencies target names, so repeated loops or gates need distinct persisted names.
    let name = request.name
    let suffix = 2
    while (usedNames.has(name)) {
      name = `${request.name} ${suffix}`
      suffix += 1
    }
    usedNames.add(name)
    return { ...request, name }
  })

  // The builder represents a linear success path from each card to the next one.
  return requests.map((request, index) => ({
    ...request,
    dependsOn: index === 0
      ? []
      : [{ activity: requests[index - 1]!.name, condition: 'success' }],
  }))
}

async function createPipeline() {
  if (!validateDetails() || !canSaveDesign.value || savingPipeline.value) return
  savingPipeline.value = true
  saveError.value = ''
  try {
    await api.pipelines.create({
      name: pipelineTitle.value.trim(),
      description: pipelineDescription.value.trim(),
      steps: pipelineStepRequests(),
    })
    localStorage.removeItem(localKey)
    clearNuxtData('pipelines-catalog')
    allowRouteLeave.value = true
    await router.push('/app/pipelines')
  } catch (error) {
    saveError.value = apiErrorMessage(error, 'The pipeline could not be saved. Please try again.')
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
    const draft = JSON.parse(raw) as {
      activities?: unknown
      loopIds?: unknown
      localLoops?: unknown
      title?: unknown
      description?: unknown
      step?: unknown
    }
    pipelineTitle.value = typeof draft.title === 'string' ? draft.title : ''
    pipelineDescription.value = typeof draft.description === 'string' ? draft.description : ''
    if (Array.isArray(draft.localLoops)) {
      localLoops.value = draft.localLoops.flatMap((candidate): LoopSummary[] => {
        if (!candidate || typeof candidate !== 'object') return []
        const value = candidate as Record<string, unknown>
        if (
          typeof value.id !== 'string'
          || typeof value.title !== 'string'
          || !isLoopFlow(value.flow)
          || !Array.isArray(value.agents)
        ) return []
        return [{
          id: value.id,
          title: value.title,
          description: typeof value.description === 'string' ? value.description : '',
          flow: value.flow,
          status: typeof value.status === 'string' ? value.status : 'draft',
          agents: value.agents.flatMap((agent): LoopAgentInput[] => {
            if (!agent || typeof agent !== 'object') return []
            const item = agent as Record<string, unknown>
            if (typeof item.persona_id !== 'string' || typeof item.model_id !== 'string' || !isLoopRole(item.role)) return []
            return [{ persona_id: item.persona_id, model_id: item.model_id, role: item.role }]
          }),
          stop_conditions: value.stop_conditions && typeof value.stop_conditions === 'object'
            ? value.stop_conditions as LoopStopConditions
            : { max_iterations: 3, max_tokens: null, timeout_seconds: null },
        }]
      })
    }
    if (Array.isArray(draft.activities)) {
      activities.value = draft.activities.flatMap((candidate): PipelineActivity[] => {
        if (!candidate || typeof candidate !== 'object') return []
        const value = candidate as Record<string, unknown>
        const instanceId = typeof value.instanceId === 'string' ? value.instanceId : createInstanceId()
        if (value.type === 'loop' && typeof value.loopId === 'string') {
          return [{ instanceId, type: 'loop', loopId: value.loopId }]
        }
        if (value.type === 'human-gate' && typeof value.gate === 'string' && gateById.has(value.gate as HumanGateKind)) {
          const gate = value.gate as HumanGateKind
          if (gate === 'multiple-choice-quiz') {
            const rawScore = typeof value.passingScore === 'number' && Number.isFinite(value.passingScore)
              ? Math.trunc(value.passingScore)
              : null
            return [{
              instanceId,
              type: 'human-gate',
              gate,
              passingScore: rawScore === null ? null : Math.min(10, Math.max(1, rawScore)),
            }]
          }

          const slotCount = gate === 'four-eye-review' ? 2 : 1
          const savedMembers = Array.isArray(value.teamMembers) ? value.teamMembers : []
          return [{
            instanceId,
            type: 'human-gate',
            gate,
            teamMembers: Array.from(
              { length: slotCount },
              (_, index) => savedMembers[index] === 'any-person' ? 'any-person' as const : null,
            ),
          }]
        }
        return []
      })
    } else if (Array.isArray(draft.loopIds)) {
      activities.value = draft.loopIds
        .filter((id): id is string => typeof id === 'string')
        .map(loopId => ({ instanceId: createInstanceId(), type: 'loop', loopId }))
    }
    if (route.query.step !== 'design' && route.query.step !== 'details' && draft.step === 'details') {
      builderStep.value = 'details'
    }
  } catch {
    localStorage.removeItem(localKey)
  }
}

function isLoopFlow(value: unknown): value is LoopFlow {
  return value === 'direct' || value === 'refinement' || value === 'roundtable'
}

function isLoopRole(value: unknown): value is LoopRole {
  return value === 'generator' || value === 'reviewer' || value === 'aggregator'
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
    if (canSaveDesign.value) builderStep.value = 'details'
    else await router.replace({ query: { ...route.query, step: 'design' } })
  }
})

watch(builderStep, async (step) => {
  await nextTick()
  if (step === 'design' && stageRoot.value) {
    stageResizeObserver?.observe(stageRoot.value)
    measureStage()
  }
})

onMounted(async () => {
  restoreLocalDraft()
  if (builderStep.value === 'details' && !canSaveDesign.value) {
    builderStep.value = 'design'
    await router.replace({ query: { ...route.query, step: 'design' } })
  }
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('resize', measureStage)
  stageResizeObserver = new ResizeObserver(measureStage)
  if (stageRoot.value) stageResizeObserver.observe(stageRoot.value)
  nextTick(measureStage)
})

onBeforeUnmount(() => {
  stageResizeObserver?.disconnect()
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', measureStage)
})

definePageMeta({ layout: 'app' })
useHead({ title: 'Create a pipeline · Looping Louie' })
</script>

<template>
  <UiContainer size="wide" class="pipeline-builder">
    <header class="pipeline-builder__topbar">
      <UiFormProgress :steps="builderSteps" :current="builderStepIndex" />
    </header>

    <UiBreadcrumb
      :items="breadcrumbItems"
      class="pipeline-builder__breadcrumb"
    />

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
          <UiButton v-if="builderStep === 'design'" :disabled="!canSaveDesign" @click="saveDesign">
            Save design
          </UiButton>
          <UiButton v-else :disabled="!canSavePipeline" :loading="savingPipeline" @click="createPipeline">
            Save pipeline
          </UiButton>
          <p v-if="builderStep === 'design' && designHint" class="pipeline-builder__design-hint">{{ designHint }}</p>
          <p v-if="saveError" class="pipeline-builder__save-error" role="alert">{{ saveError }}</p>
        </div>
      </template>
    </UiHeadingBlock>

    <div v-if="builderStep === 'design'" ref="stageRoot" class="pipeline-builder__stage">
      <UiCollectionGroupTitle title="Your pipeline" heading-as="h2" />
      <UiSectionStage inverse="bottom">
        <PipelineCanvas
          :activities="canvasActivities"
          @add-loop="openLoopDrawer"
          @add-human-gate="openHumanGatePalette"
          @remove="removeActivity"
          @move="swapActivities"
          @choose-member="openMemberPalette"
          @update-passing-score="updatePassingScore"
        />
      </UiSectionStage>
    </div>

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

    <PipelineLoopDrawer
      v-model:open="loopDrawerOpen"
      :personas="loopOptionsData?.personas ?? []"
      :models="loopOptionsData?.models ?? []"
      :loading="loopOptionsStatus === 'pending'"
      @add="addLocalLoop"
    />

    <UiCommandPalette
      v-model:open="paletteOpen"
      v-model:query="paletteQuery"
      :items="paletteItems"
      :size="palettePresentation.size"
      option-style="card"
      :placeholder="palettePresentation.placeholder"
      :aria-label="palettePresentation.ariaLabel"
      :empty-title="palettePresentation.emptyTitle"
      :empty-description="palettePresentation.emptyDescription"
      @select="selectPaletteItem"
    >
      <template #item="{ item }">
        <span v-if="paletteKind === 'human-gates'" class="pipeline-builder__gate-option">
          <span class="pipeline-builder__gate-option-icon" aria-hidden="true">
            <svg viewBox="0 0 256 256" fill="currentColor"><path :d="item.iconPath" /></svg>
          </span>
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </span>
        <span v-else class="pipeline-builder__gate-option">
          <span class="pipeline-builder__gate-option-icon" aria-hidden="true">
            <svg viewBox="0 0 256 256" fill="currentColor"><path :d="item.iconPath" /></svg>
          </span>
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </span>
      </template>
    </UiCommandPalette>

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
        <UiButton variant="coral" :disabled="exitActionPending" @click="discardDraftAndLeave">
          Discard draft
        </UiButton>
        <UiButton data-autofocus :loading="exitActionPending" @click="saveDraftAndLeave">
          Save draft
        </UiButton>
      </template>
    </UiModal>
  </UiContainer>
</template>

<style scoped>
.pipeline-builder {
  padding-block: var(--ll-space-6) 0;
}

.pipeline-builder__topbar {
  width: calc(100% + var(--ui-container-gutter));
  margin-bottom: var(--ll-space-10);
}

.pipeline-builder__breadcrumb {
  margin-bottom: var(--ll-space-5);
}

.pipeline-builder__heading {
  margin-bottom: var(--ll-space-10);
}

.pipeline-builder__heading-actions {
  display: grid;
  max-width: 22rem;
  justify-items: end;
  gap: var(--ll-space-3);
}

.pipeline-builder__save-error {
  margin: 0;
  color: var(--ll-color-brand-ink);
  font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control);
  text-align: right;
}

.pipeline-builder__design-hint {
  margin: 0;
  color: var(--ll-color-text-muted);
  font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control);
  text-align: right;
}

.pipeline-builder__details {
  display: grid;
  gap: var(--ll-space-6);
  padding-bottom: var(--ll-space-12);
}

.pipeline-builder__field-stage {
  min-width: 0;
}

.pipeline-builder__field-stage :deep(.ui-section-stage__shell) {
  width: 100%;
  margin-inline: 0;
}

.pipeline-builder__stage {
  --pipeline-stage-min-height: 28rem;
}

.pipeline-builder__stage :deep(.ui-section-stage__shell) {
  width: 100%;
  min-height: var(--pipeline-stage-min-height);
  margin-inline: 0;
}

.pipeline-builder__stage :deep(.ui-section-stage__content) {
  display: flex;
  min-height: var(--pipeline-stage-min-height);
  box-sizing: border-box;
  align-items: stretch;
}

.pipeline-builder__gate-option {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-3);
}

.pipeline-builder__gate-option-icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  box-sizing: border-box;
  place-items: center;
  color: var(--ll-color-ink);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: 50%;
}

.pipeline-builder__gate-option-icon svg {
  width: 1.15rem;
  height: 1.15rem;
}

.pipeline-builder__gate-option > span:last-child {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.pipeline-builder__gate-option strong {
  color: var(--ll-color-ink);
  font: 600 var(--ll-text-sm) / 1.25 var(--ll-font-control);
}

.pipeline-builder__gate-option small {
  overflow: hidden;
  color: var(--ll-color-text-muted);
  font: 400 var(--ll-text-xs) / 1.35 var(--ll-font-control);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 48rem) {
  .pipeline-builder__heading {
    margin-bottom: var(--ll-space-8);
  }

  .pipeline-builder__heading-actions {
    width: 100%;
    max-width: none;
    justify-items: start;
  }

  .pipeline-builder__save-error {
    text-align: left;
  }

  .pipeline-builder__design-hint {
    text-align: left;
  }

}
</style>
