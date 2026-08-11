<script setup lang="ts">
import PipelineLoopCard from '~/components/pipelines/PipelineLoopCard.vue'
import PipelineLoopDrawer from '~/components/pipelines/PipelineLoopDrawer.vue'
import PipelineHumanGateCard from '~/components/pipelines/PipelineHumanGateCard.vue'
import PipelineConnector from '~/components/pipelines/PipelineConnector.vue'
import PipelineOutcomeRoute from '~/components/pipelines/PipelineOutcomeRoute.vue'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'

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
  status: string
  agents: LoopAgent[]
  stop_conditions: LoopStopConditions | null
}

interface LoopListResponse {
  items: LoopSummary[]
  total: number
}

interface PersonaSummary {
  id: string
  name: string
  description?: string
  source_instruction_id?: string | null
}

interface ModelSummary {
  id: string
  name: string
  vendor: string
  family: string
}

interface ListResponse<T> {
  items: T[]
  total: number
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
const stageRoot = ref<HTMLElement | null>(null)
const paletteOpen = ref(false)
const paletteQuery = ref('')
const paletteKind = ref<'human-gates' | 'users'>('human-gates')
const loopDrawerOpen = ref(false)
const localLoops = ref<LoopSummary[]>([])
const activities = ref<PipelineActivity[]>([])
const memberSelectionTarget = ref<{ instanceId: string, slotIndex: number } | null>(null)
const addMenuOpen = ref(false)
const draggingActivityId = ref<string | null>(null)
const dropTargetActivityId = ref<string | null>(null)
const highlightedOutcome = ref<'success' | 'failure' | null>(null)
const exitModalOpen = ref(false)
const exitActionPending = ref(false)
const allowRouteLeave = ref(false)
const pendingDestination = ref('/app/pipelines')
const localKey = 'looping-louie:pipeline-builder-draft:v1'
let stageResizeObserver: ResizeObserver | undefined
let touchHoldTimer: ReturnType<typeof setTimeout> | undefined
let touchPointerId: number | null = null

const { data } = await useAsyncData(
  'pipeline-builder-loops',
  () => $fetch<LoopListResponse>('/api/v1/loops?offset=0'),
)

const { data: loopOptionsData, status: loopOptionsStatus } = await useAsyncData(
  'pipeline-builder-loop-options',
  async () => {
    const [personas, models] = await Promise.all([
      $fetch<ListResponse<PersonaSummary>>('/api/v1/personas'),
      $fetch<ListResponse<ModelSummary>>('/api/v1/models?available=true'),
    ])
    return { personas: personas.items, models: models.items }
  },
)

const loops = computed(() => [...localLoops.value, ...(data.value?.items ?? [])])
const loopById = computed(() => new Map(loops.value.map(loop => [loop.id, loop])))
const gateById = new Map(humanGates.map(gate => [gate.id, gate]))
const hasProgress = computed(() => activities.value.length > 0)
const hasLoop = computed(() => activities.value.some(activity => activity.type === 'loop'))

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
  addMenuOpen.value = false
  memberSelectionTarget.value = null
  loopDrawerOpen.value = true
}

function openHumanGatePalette() {
  addMenuOpen.value = false
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
  addMenuOpen.value = false
  nextTick(measureStage)
}

function previousLoopDepth(index: number) {
  for (let candidate = index - 1; candidate >= 0; candidate -= 1) {
    if (activities.value[candidate]?.type === 'loop') return index - candidate
  }
  return 0
}

function failureModeFor(activity: PipelineActivity, index: number) {
  if (activity.type === 'loop') return 'stop' as const
  if (activity.gate === 'multiple-choice-quiz') return 'retry' as const
  return previousLoopDepth(index) ? 'previous' as const : 'stop' as const
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

function resetDragState() {
  if (touchHoldTimer) clearTimeout(touchHoldTimer)
  touchHoldTimer = undefined
  touchPointerId = null
  draggingActivityId.value = null
  dropTargetActivityId.value = null
}

function onDragStart(event: DragEvent, instanceId: string) {
  draggingActivityId.value = instanceId
  event.dataTransfer?.setData('text/plain', instanceId)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event: DragEvent, instanceId: string) {
  if (!draggingActivityId.value || draggingActivityId.value === instanceId) return
  event.preventDefault()
  dropTargetActivityId.value = instanceId
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDrop(event: DragEvent, instanceId: string) {
  event.preventDefault()
  const sourceId = draggingActivityId.value || event.dataTransfer?.getData('text/plain')
  if (sourceId) swapActivities(sourceId, instanceId)
  resetDragState()
}

function onActivityKeydown(event: KeyboardEvent, instanceId: string) {
  if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const index = activities.value.findIndex(activity => activity.instanceId === instanceId)
  const target = event.key === 'ArrowUp' ? index - 1 : index + 1
  const targetActivity = activities.value[target]
  if (!targetActivity) return
  swapActivities(instanceId, targetActivity.instanceId)
  nextTick(() => document.querySelector<HTMLElement>(`[data-activity-id="${instanceId}"]`)?.focus())
}

function onActivityPointerDown(event: PointerEvent, instanceId: string) {
  if (event.pointerType !== 'touch' || (event.target as HTMLElement).closest('button, a, input, textarea, select, [role="button"]')) return
  touchPointerId = event.pointerId
  touchHoldTimer = setTimeout(() => {
    draggingActivityId.value = instanceId
    navigator.vibrate?.(20)
  }, 320)
}

function onActivityPointerMove(event: PointerEvent) {
  if (touchPointerId !== event.pointerId || !draggingActivityId.value) return
  event.preventDefault()
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-activity-id]')
  const targetId = target?.dataset.activityId
  dropTargetActivityId.value = targetId && targetId !== draggingActivityId.value ? targetId : null
}

function onActivityPointerEnd(event: PointerEvent) {
  if (touchPointerId !== event.pointerId) return
  if (draggingActivityId.value && dropTargetActivityId.value) {
    swapActivities(draggingActivityId.value, dropTargetActivityId.value)
  }
  resetDragState()
}

function measureStage() {
  if (!import.meta.client || !stageRoot.value) return
  const shell = stageRoot.value.querySelector<HTMLElement>('.ui-section-stage__shell')
  if (!shell) return
  const remainingHeight = Math.max(400, window.innerHeight - shell.getBoundingClientRect().top)
  stageRoot.value.style.setProperty('--pipeline-stage-min-height', `${remainingHeight}px`)
}

function restoreLocalDraft() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(localKey)
  if (!raw) return
  try {
    const draft = JSON.parse(raw) as { activities?: unknown, loopIds?: unknown, localLoops?: unknown }
    if (Array.isArray(draft.localLoops)) {
      localLoops.value = draft.localLoops.flatMap((candidate): LoopSummary[] => {
        if (!candidate || typeof candidate !== 'object') return []
        const value = candidate as Record<string, unknown>
        if (
          typeof value.id !== 'string'
          || typeof value.title !== 'string'
          || !Array.isArray(value.agents)
        ) return []
        return [{
          id: value.id,
          title: value.title,
          description: typeof value.description === 'string' ? value.description : '',
          flow: typeof value.flow === 'string' ? value.flow : null,
          status: typeof value.status === 'string' ? value.status : 'draft',
          agents: value.agents.flatMap((agent): LoopAgent[] => {
            if (!agent || typeof agent !== 'object') return []
            const item = agent as Record<string, unknown>
            if (typeof item.persona_id !== 'string' || typeof item.model_id !== 'string' || typeof item.role !== 'string') return []
            return [{ persona_id: item.persona_id, model_id: item.model_id, role: item.role }]
          }),
          stop_conditions: value.stop_conditions && typeof value.stop_conditions === 'object'
            ? value.stop_conditions as LoopStopConditions
            : null,
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
    localStorage.setItem(localKey, JSON.stringify({
      activities: activities.value,
      localLoops: localLoops.value,
      updatedAt: new Date().toISOString(),
    }))
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

onMounted(() => {
  restoreLocalDraft()
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('resize', measureStage)
  stageResizeObserver = new ResizeObserver(measureStage)
  if (stageRoot.value) stageResizeObserver.observe(stageRoot.value)
  nextTick(measureStage)
})

onBeforeUnmount(() => {
  if (touchHoldTimer) clearTimeout(touchHoldTimer)
  stageResizeObserver?.disconnect()
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', measureStage)
})

definePageMeta({ layout: 'app' })
useHead({ title: 'Create a pipeline · Looping Louie' })
</script>

<template>
  <UiContainer size="wide" class="pipeline-builder">
    <UiBreadcrumb
      :items="[
        { label: 'Pipelines', to: '/app/pipelines' },
        { label: 'Create new pipeline' },
      ]"
      class="pipeline-builder__breadcrumb"
    />

    <UiHeadingBlock layout="split" size="section" align="start" class="pipeline-builder__heading">
      <template #title>
        <h1>Build a new pipeline</h1>
      </template>
      <template #description>
        <p>Connect existing loops into one clear, repeatable workflow.</p>
      </template>
      <template #aside>
        <UiButton :disabled="!hasLoop">Save pipeline</UiButton>
      </template>
    </UiHeadingBlock>

    <div ref="stageRoot" class="pipeline-builder__stage">
      <UiCollectionGroupTitle title="Your pipeline" heading-as="h2" />
      <UiSectionStage inverse="bottom">
        <div class="pipeline-builder__canvas">
          <div class="pipeline-builder__input-node">
            <UiPill class="pipeline-builder__input-pill" :focusable="false">Input prompt</UiPill>
            <PipelineConnector />
          </div>

          <div v-if="activities.length === 0" class="pipeline-builder__empty">
            <UiPill class="pipeline-builder__empty-pill" :focusable="false">
              <UiButton @click="openLoopDrawer">
                Add a loop to your new pipeline
              </UiButton>
            </UiPill>
          </div>

          <div v-else class="pipeline-builder__content">
            <ol class="pipeline-builder__loops" aria-label="Activities in this pipeline">
            <li
              v-for="(activity, index) in activities"
              :key="activity.instanceId"
              class="pipeline-builder__step"
              :class="{
                'is-dragging': draggingActivityId === activity.instanceId,
                'is-drop-target': dropTargetActivityId === activity.instanceId,
              }"
              :data-activity-id="activity.instanceId"
              draggable="true"
              tabindex="0"
              :aria-label="`Pipeline activity ${index + 1} of ${activities.length}. Hold and drag to exchange its position, or use Alt plus an arrow key.`"
              @dragstart="onDragStart($event, activity.instanceId)"
              @dragover="onDragOver($event, activity.instanceId)"
              @dragleave.self="dropTargetActivityId = null"
              @drop="onDrop($event, activity.instanceId)"
              @dragend="resetDragState"
              @keydown="onActivityKeydown($event, activity.instanceId)"
              @pointerdown="onActivityPointerDown($event, activity.instanceId)"
              @pointermove="onActivityPointerMove"
              @pointerup="onActivityPointerEnd"
              @pointercancel="onActivityPointerEnd"
            >
              <PipelineLoopCard
                v-if="activity.type === 'loop' && loopById.get(activity.loopId)"
                :loop="loopById.get(activity.loopId)!"
                :instance-id="activity.instanceId"
                @remove="removeActivity"
              />
              <PipelineHumanGateCard
                v-else-if="activity.type === 'human-gate' && gateById.get(activity.gate)"
                :title="gateById.get(activity.gate)!.title"
                :instance-id="activity.instanceId"
                :gate="activity.gate"
                :team-members="activity.teamMembers"
                :passing-score="activity.passingScore"
                @remove="removeActivity"
                @choose-member="openMemberPalette"
                @update-passing-score="updatePassingScore"
              />

              <div class="pipeline-builder__drop-cue" aria-hidden="true">
                <span>
                  <svg viewBox="0 0 256 256" fill="currentColor">
                    <path d="M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z" />
                  </svg>
                  Swap position
                </span>
              </div>

              <PipelineOutcomeRoute
                :failure-mode="failureModeFor(activity, index)"
                :return-depth="previousLoopDepth(index) || 1"
                :highlighted="highlightedOutcome"
                @highlight="highlightedOutcome = $event"
              />
            </li>
            </ol>

            <div class="pipeline-builder__insertion">
            <UiButton
              variant="secondary"
              icon-only
              :aria-label="addMenuOpen ? 'Close step menu' : 'Add a pipeline step'"
              :aria-expanded="addMenuOpen"
              aria-controls="pipeline-step-actions"
              @click="addMenuOpen = !addMenuOpen"
            >
              <template #leading>
                <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z" />
                </svg>
              </template>
            </UiButton>

            <Transition name="pipeline-step-actions">
              <div v-if="addMenuOpen" id="pipeline-step-actions" class="pipeline-builder__action-menu">
                <PipelineConnector variant="branches" class="pipeline-builder__branch-map" />
                <div class="pipeline-builder__actions">
                  <div class="pipeline-builder__action-branch">
                    <PipelineConnector class="pipeline-builder__mobile-branch" />
                    <UiButton @click="openLoopDrawer">
                      <template #leading>
                        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                          <path d="M253.93,154.63c-1.32-1.46-24.09-26.22-61-40.56-1.72-18.42-8.46-35.17-19.41-47.92C158.87,49,137.58,40,112,40,60.48,40,26.89,86.18,25.49,88.15a8,8,0,0,0,13,9.31C38.8,97.05,68.81,56,112,56c20.77,0,37.86,7.11,49.41,20.57,7.42,8.64,12.44,19.69,14.67,32A140.87,140.87,0,0,0,140.6,104c-26.06,0-47.93,6.81-63.26,19.69C63.78,135.09,56,151,56,167.25A47.59,47.59,0,0,0,69.87,201.3c9.66,9.62,23.06,14.7,38.73,14.7,51.81,0,81.18-42.13,84.49-84.42a161.43,161.43,0,0,1,49,33.79,8,8,0,1,0,11.86-10.74Zm-94.46,21.64C150.64,187.09,134.66,200,108.6,200,83.32,200,72,183.55,72,167.25,72,144.49,93.47,120,140.6,120a124.34,124.34,0,0,1,36.78,5.68C176.93,144.44,170.46,162.78,159.47,176.27Z" />
                        </svg>
                      </template>
                      Add loop
                    </UiButton>
                  </div>
                  <div class="pipeline-builder__action-branch">
                    <PipelineConnector class="pipeline-builder__mobile-branch" />
                    <UiButton variant="stroke" @click="openHumanGatePalette">
                      <template #leading>
                        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                          <path d="M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z" />
                        </svg>
                      </template>
                      Add human gate
                    </UiButton>
                  </div>
                  <div class="pipeline-builder__action-branch">
                    <PipelineConnector class="pipeline-builder__mobile-branch" />
                    <UiButton variant="metal">
                      <template #leading>
                        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                          <path d="M178.16,176H111.32A48,48,0,1,1,25.6,139.19a8,8,0,0,1,12.8,9.61A31.69,31.69,0,0,0,32,168a32,32,0,0,0,64,0,8,8,0,0,1,8-8h74.16a16,16,0,1,1,0,16ZM64,184a16,16,0,0,0,14.08-23.61l35.77-58.14a8,8,0,0,0-2.62-11,32,32,0,1,1,46.1-40.06A8,8,0,1,0,172,44.79a48,48,0,1,0-75.62,55.33L64.44,152c-.15,0-.29,0-.44,0a16,16,0,0,0,0,32Zm128-64a48.18,48.18,0,0,0-18,3.49L142.08,71.6A16,16,0,1,0,128,80l.44,0,35.78,58.15a8,8,0,0,0,11,2.61A32,32,0,1,1,192,200a8,8,0,0,0,0,16,48,48,0,0,0,0-96Z" />
                        </svg>
                      </template>
                      Add hook
                    </UiButton>
                  </div>
                </div>
              </div>
            </Transition>
            </div>
          </div>
        </div>
      </UiSectionStage>
    </div>

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

.pipeline-builder__breadcrumb {
  margin-bottom: var(--ll-space-5);
}

.pipeline-builder__heading {
  margin-bottom: var(--ll-space-10);
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

.pipeline-builder__canvas {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
}

.pipeline-builder__input-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pipeline-builder__input-pill :deep(.ui-icon-pill__trigger) {
  background: transparent;
  border-style: dashed;
}

.pipeline-builder__empty-pill,
.pipeline-builder__empty-pill :deep(.ui-icon-pill__trigger) {
  height: auto;
}

.pipeline-builder__empty-pill :deep(.ui-icon-pill__trigger) {
  padding: 0.125rem;
}

.pipeline-builder__empty-pill :deep(.ui-icon-pill__label) {
  overflow: visible;
}

.pipeline-builder__empty {
  display: flex;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
  gap: var(--ll-space-4);
  padding-top: 0;
}

.pipeline-builder__content {
  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  flex-direction: column;
  align-items: stretch;
  padding-bottom: clamp(7rem, 12vh, 10rem);
}

.pipeline-builder__loops {
  width: 100%;
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pipeline-builder__step {
  position: relative;
  width: 100%;
  border-radius: var(--ll-radius-structural);
  cursor: grab;
  outline: none;
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out);
}

.pipeline-builder__step:active {
  cursor: grabbing;
}

.pipeline-builder__step.is-dragging {
  opacity: 0.38;
}

.pipeline-builder__step:focus-visible :deep(.pipeline-loop-card__main),
.pipeline-builder__step:focus-visible :deep(.pipeline-human-gate-card__main) {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}

.pipeline-builder__drop-cue {
  position: absolute;
  z-index: 6;
  top: 0;
  left: 50%;
  display: grid;
  width: min(100%, 26rem);
  height: 7.5rem;
  box-sizing: border-box;
  place-items: center;
  color: var(--ll-color-primary-depth);
  background: color-mix(in srgb, var(--ll-color-metal-025) 92%, transparent);
  border: 2px solid var(--ll-color-primary);
  border-radius: var(--ll-radius-structural);
  box-shadow: var(--ll-shadow-raised), 0 0 0 0.35rem var(--ll-color-primary-highlight);
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) scale(0.985);
  transition:
    opacity var(--ll-duration-fast) var(--ll-ease-out),
    transform var(--ll-duration-fast) var(--ll-ease-out);
}

.pipeline-builder__drop-cue span {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-2);
  padding: var(--ll-space-2) var(--ll-space-3);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: 999px;
  font: 650 var(--ll-text-xs) / 1 var(--ll-font-control);
  box-shadow: var(--ll-shadow-raised);
}

.pipeline-builder__drop-cue svg {
  width: 1rem;
  height: 1rem;
}

.pipeline-builder__step.is-drop-target .pipeline-builder__drop-cue {
  opacity: 1;
  transform: translateX(-50%) scale(1);
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

.pipeline-builder__insertion {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.pipeline-builder__action-menu {
  display: flex;
  width: min(100%, 48rem);
  flex-direction: column;
}

.pipeline-builder__branch-map {
  width: 100%;
}

.pipeline-builder__actions {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ll-space-4);
}

.pipeline-builder__action-branch {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: var(--ll-space-3);
  color: var(--ll-color-divider);
}

.pipeline-builder__mobile-branch {
  display: none;
}

.pipeline-builder__action-branch :deep(.ui-button) {
  max-width: 100%;
}

.pipeline-step-actions-enter-active,
.pipeline-step-actions-leave-active {
  transition:
    opacity var(--ll-duration-normal) var(--ll-ease-out),
    transform var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-step-actions-enter-from,
.pipeline-step-actions-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (max-width: 48rem) {
  .pipeline-builder__heading {
    margin-bottom: var(--ll-space-8);
  }

  .pipeline-builder__actions {
    grid-template-columns: 1fr;
  }

  .pipeline-builder__branch-map {
    display: none;
  }

  .pipeline-builder__action-branch {
    grid-template-columns: 3rem minmax(0, 1fr);
    align-items: center;
    justify-items: start;
  }

  .pipeline-builder__mobile-branch {
    display: block;
    width: 3rem;
    height: 2.25rem;
    transform: rotate(-90deg);
  }

  .pipeline-builder__action-branch :deep(.ui-button) {
    width: 100%;
  }

  .pipeline-builder__drop-cue {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline-step-actions-enter-active,
  .pipeline-step-actions-leave-active {
    transition: none;
  }

  .pipeline-builder__step,
  .pipeline-builder__drop-cue {
    transition: none;
  }
}
</style>
