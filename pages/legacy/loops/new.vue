<script setup lang="ts">
import LoopTeamPreview from '~/components/loops/LoopTeamPreview.vue'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'
import UiFormProgress from '~/components/ui/FormProgress.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'

type Flow = 'direct' | 'refinement' | 'roundtable'
type Role = 'generator' | 'reviewer' | 'aggregator'
type BinaryChoice = 'yes' | 'no'
type BuilderStep = 'brief' | 'flow' | 'generators' | 'generator-models' | 'reviewer-gate' | 'reviewers' | 'reviewer-models' | 'aggregator-gate' | 'aggregator' | 'aggregator-models' | 'stop-conditions' | 'review'

interface StopConditions {
  max_iterations: number | null
  max_tokens: number | null
  timeout_seconds: number | null
}

interface Persona {
  id: string
  name: string
  description: string
}

interface Model {
  id: string
  name: string
  vendor: string
  family: string
}

interface Assignment {
  persona_id: string
  model_id: string
  role: Role
}

interface LoopDraft {
  id: string
  title: string
  prompt: string
  flow: Flow | null
  status: string
  stop_conditions: StopConditions
  agents: Array<Assignment & { id: string }>
}

interface ListResponse<T> {
  items: T[]
  total: number
}

const router = useRouter()
const route = useRoute()
const { personaIcon } = usePersonaIcon()
const { providerLogo } = useModelLogo()

const { data: optionsData, status: optionsStatus, error: optionsError, refresh: refreshOptions } = await useAsyncData(
  'loop-builder-options',
  async () => {
    const [personas, models] = await Promise.all([
      $fetch<ListResponse<Persona>>('/api/v1/personas'),
      $fetch<ListResponse<Model>>('/api/v1/models?available=true'),
    ])
    return { personas: personas.items, models: models.items }
  },
)

const personas = computed(() => optionsData.value?.personas ?? [])
const models = computed(() => optionsData.value?.models ?? [])
const personaById = computed(() => new Map(personas.value.map(persona => [persona.id, persona])))
const modelById = computed(() => new Map(models.value.map(model => [model.id, model])))

const steps = ['Brief', 'Team', 'Stop conditions', 'Review']
const step = ref<BuilderStep>('brief')
const stepHistory = ref<BuilderStep[]>([])
const title = ref('')
const prompt = ref('')
const flow = ref<Flow | ''>('')
const confirmingFlow = ref<Flow | ''>('')
const confirmingGateChoice = ref<BinaryChoice | ''>('')
const selected = reactive<Record<Role, string[]>>({ generator: [], reviewer: [], aggregator: [] })
const assignments = ref<Assignment[]>([])
const stopConditions = reactive({
  maxIterations: '',
  maxTokens: '',
  timeoutSeconds: '',
})
const reviewerChoice = ref<'yes' | 'no' | ''>('')
const aggregatorChoice = ref<'yes' | 'no' | ''>('')
const modelIndex = ref(0)
const draftId = ref('')
const activating = ref(false)
const exitModalOpen = ref(false)
const exitActionPending = ref(false)
const pendingDestination = ref('/legacy/loops')
const allowRouteLeave = ref(false)
const briefErrors = reactive({ title: '', prompt: '' })
const mobileSummaryOpen = ref(false)
const localKey = 'looping-louie:loop-builder-draft:v1'
const questionRoot = ref<HTMLElement | null>(null)
const navigationBounds = reactive({ left: 0, width: 0 })
let questionResizeObserver: ResizeObserver | undefined
let summaryButtonTouchStartY: number | null = null
let summaryPanelTouchStartY: number | null = null
let summaryPanelCanDismiss = false
let suppressSummaryButtonClick = false
let previousBodyOverflow = ''

const macroStep = computed(() => {
  if (step.value === 'brief') return 0
  if (step.value === 'stop-conditions') return 2
  if (step.value === 'review') return 3
  return 1
})
const isModelStep = computed(() => step.value.endsWith('-models'))
const modelRole = computed<Role | null>(() => {
  if (step.value === 'generator-models') return 'generator'
  if (step.value === 'reviewer-models') return 'reviewer'
  if (step.value === 'aggregator-models') return 'aggregator'
  return null
})
const currentPersonaId = computed(() => modelRole.value ? selected[modelRole.value][modelIndex.value] : undefined)
const currentPersona = computed(() => currentPersonaId.value ? personaById.value.get(currentPersonaId.value) : undefined)
const currentAssignment = computed(() => assignments.value.find(assignment => assignment.role === modelRole.value && assignment.persona_id === currentPersonaId.value))
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Loops', to: '/legacy/loops' },
    { label: 'Create new loop' },
    { label: steps[macroStep.value] },
  ]
  const tails: Partial<Record<BuilderStep, string[]>> = {
    flow: ['Flow'],
    generators: ['Generators'],
    'generator-models': ['Generators', 'Models'],
    'reviewer-gate': ['Reviewers'],
    reviewers: ['Reviewers'],
    'reviewer-models': ['Reviewers', 'Models'],
    'aggregator-gate': ['Aggregator'],
    aggregator: ['Aggregator'],
    'aggregator-models': ['Aggregator', 'Models'],
  }
  for (const label of tails[step.value] ?? []) items.push({ label })
  return items
})
const selectionRole = computed<Role | null>(() => {
  if (step.value === 'generators') return 'generator'
  if (step.value === 'reviewers') return 'reviewer'
  if (step.value === 'aggregator') return 'aggregator'
  return modelRole.value
})
const directoryStageTitle = computed(() => {
  if (!selectionRole.value) return ''
  const role = `${selectionRole.value[0].toUpperCase()}${selectionRole.value.slice(1)}`
  return `${role} ${isModelStep.value ? 'model' : 'agent'}`
})
const stopConditionsValue = computed<StopConditions>(() => ({
  max_iterations: positiveInteger(stopConditions.maxIterations),
  max_tokens: positiveInteger(stopConditions.maxTokens),
  timeout_seconds: positiveInteger(stopConditions.timeoutSeconds),
}))
const hasStopCondition = computed(() => stopConditionsValue.value.max_iterations !== null)
const showBuilderAside = computed(() => (
  (macroStep.value === 1 && step.value !== 'flow') || step.value === 'stop-conditions'
))
const navigationStyle = computed(() => navigationBounds.width
  ? { left: `${navigationBounds.left}px`, width: `${navigationBounds.width}px` }
  : undefined)
const hasProgress = computed(() => Boolean(
  title.value.trim()
  || prompt.value.trim()
  || flow.value
  || selected.generator.length
  || selected.reviewer.length
  || selected.aggregator.length
  || draftId.value,
))
const canContinue = computed(() => {
  if (step.value === 'brief') return Boolean(title.value.trim() && prompt.value.trim())
  if (step.value === 'flow') return Boolean(flow.value)
  if (step.value === 'generators') return selected.generator.length >= (flow.value === 'roundtable' ? 2 : 1)
  if (step.value === 'reviewers') return selected.reviewer.length >= 1
  if (step.value === 'aggregator') return selected.aggregator.length === 1
  if (step.value === 'stop-conditions') return hasStopCondition.value
  if (isModelStep.value) return Boolean(currentAssignment.value)
  if (step.value === 'reviewer-gate') return Boolean(reviewerChoice.value)
  if (step.value === 'aggregator-gate') return Boolean(aggregatorChoice.value)
  return Boolean(flow.value && hasStopCondition.value && completeAgents().length === selected.generator.length + selected.reviewer.length + selected.aggregator.length)
})

const flowOptions = [
  { value: 'direct' as const, title: 'Direct', description: 'One or more agents produce the result directly.' },
  { value: 'refinement' as const, title: 'Refinement', description: 'One generator improves the result with reviewer feedback.' },
  { value: 'roundtable' as const, title: 'Roundtable', description: 'Several generators explore the prompt before one agent combines their work.' },
]

const gateOptions = computed(() => [
  {
    value: 'yes' as const,
    title: 'Yes',
    description: step.value === 'reviewer-gate' ? 'Add reviewers to the team.' : 'Add one aggregator.',
  },
  { value: 'no' as const, title: 'No', description: 'Continue without this role.' },
])

const currentGateChoice = computed(() => (
  step.value === 'reviewer-gate' ? reviewerChoice.value : aggregatorChoice.value
))

const personaQuestions: Record<string, string> = {
  product_manager: 'What problem does this solve?',
  founder: 'Will this help the company grow?',
  ux_designer: 'What should the experience feel like?',
  tech_lead: 'How should this be built?',
  enterprise_customer: 'Would I pay for this?',
  growth: 'Will this help us sell?',
  devils_advocate: 'Why might this fail?',
  finance: 'What is the expected return?',
  platform_architect: 'Does this fit the system?',
  editor: 'How should the final answer be shaped?',
}

function personaKey(persona: Persona) {
  return persona.id.replace('builtin:persona:', '').replaceAll('-', '_')
}

function personaQuestion(persona: Persona) {
  return personaQuestions[personaKey(persona)] || persona.description
}

function modelLogo(model: Model) {
  return providerLogo(model.vendor, model.family)
}

function modelInitials(model: Model) {
  return model.vendor
    .split(/[\s.]+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function positiveInteger(value: string | number | null | undefined) {
  if (value === '' || value == null) return null
  const parsed = Number(String(value).replaceAll(',', ''))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function formatIntegerInput(value: string | number | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function updateStopCondition(field: 'maxIterations' | 'maxTokens' | 'timeoutSeconds', event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const formatted = formatIntegerInput(input.value)
  input.value = formatted
  stopConditions[field] = formatted
}

function measureNavigation() {
  if (!questionRoot.value) return
  const bounds = questionRoot.value.getBoundingClientRect()
  const stageShell = questionRoot.value.querySelector<HTMLElement>('.ui-section-stage__shell')
  const measuredRight = stageShell?.getBoundingClientRect().right ?? bounds.right
  const mobileRightLimit = document.documentElement.clientWidth - bounds.left
  const right = document.documentElement.clientWidth <= 704
    ? Math.min(measuredRight, mobileRightLimit)
    : measuredRight
  navigationBounds.left = bounds.left
  navigationBounds.width = Math.max(0, right - bounds.left)
}

function roleModelValue(role: Role) {
  if ((role === 'generator' && flow.value === 'refinement') || role === 'aggregator') {
    return selected[role][0] || ''
  }
  return selected[role]
}

function updateRoleSelection(role: Role, value: string | string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  selected[role] = role === 'aggregator' || (role === 'generator' && flow.value === 'refinement')
    ? values.slice(-1)
    : values
  assignments.value = assignments.value.filter(assignment => (
    assignment.role !== role || selected[role].includes(assignment.persona_id)
  ))
  saveLocal()
}

function assignmentFor(role: Role, personaId: string) {
  return assignments.value.find(assignment => assignment.role === role && assignment.persona_id === personaId)
}

function chooseModel(modelId: string) {
  if (!modelRole.value || !currentPersonaId.value) return
  const existing = assignmentFor(modelRole.value, currentPersonaId.value)
  if (existing) existing.model_id = modelId
  else assignments.value.push({ role: modelRole.value, persona_id: currentPersonaId.value, model_id: modelId })
  saveLocal()
}

function previewMembers(role: Role) {
  return selected[role].map((personaId) => {
    const persona = personaById.value.get(personaId)
    const assignment = assignmentFor(role, personaId)
    const model = assignment ? modelById.value.get(assignment.model_id) : undefined
    return {
      id: personaId,
      name: persona?.name || personaId.replace('builtin:persona:', ''),
      icon: personaIcon(persona ?? { id: personaId }),
      model: model?.name || assignment?.model_id || '',
      modelImage: model ? modelLogo(model) : undefined,
      modelInitials: model ? modelInitials(model) : undefined,
    }
  })
}

function roleStep(role: Role): BuilderStep {
  if (role === 'generator') return 'generators'
  if (role === 'reviewer') return 'reviewers'
  return 'aggregator'
}

async function editPreviewRole(role: Role) {
  const target = roleStep(role)
  if (step.value === target) return
  await goTo(target)
}

async function editPreviewModel(role: Role, personaId: string) {
  const index = selected[role].indexOf(personaId)
  if (index < 0) return
  modelIndex.value = index
  const target = `${role}-models` as BuilderStep
  if (step.value === target) {
    saveLocal()
    return
  }
  await goTo(target)
}

async function removePreviewMember(role: Role, personaId: string) {
  const removedIndex = selected[role].indexOf(personaId)
  if (removedIndex < 0) return

  selected[role] = selected[role].filter(value => value !== personaId)
  assignments.value = assignments.value.filter(assignment => (
    assignment.role !== role || assignment.persona_id !== personaId
  ))

  if (modelRole.value === role) {
    if (!selected[role].length) {
      await goTo(roleStep(role))
    } else {
      modelIndex.value = Math.min(modelIndex.value, selected[role].length - 1)
    }
  }

  saveLocal()
}

async function chooseFlow(next: Flow) {
  if (confirmingFlow.value) return

  if (next !== flow.value) {
    flow.value = next
    selected.generator = []
    selected.reviewer = []
    selected.aggregator = []
    assignments.value = []
    reviewerChoice.value = ''
    aggregatorChoice.value = ''
    saveLocal()
  }

  confirmingFlow.value = next
  await waitForChoiceConfirmation()

  try {
    await completeFlow()
  } finally {
    confirmingFlow.value = ''
  }
}

async function waitForChoiceConfirmation() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await new Promise(resolve => window.setTimeout(resolve, 520))
}

async function chooseGateChoice(next: BinaryChoice) {
  if (confirmingGateChoice.value) return
  const gate = step.value
  if (gate !== 'reviewer-gate' && gate !== 'aggregator-gate') return

  if (gate === 'reviewer-gate') reviewerChoice.value = next
  else aggregatorChoice.value = next
  saveLocal()

  confirmingGateChoice.value = next
  await waitForChoiceConfirmation()

  try {
    if (gate === 'reviewer-gate') await completeReviewerGate()
    else await completeAggregatorGate()
  } finally {
    confirmingGateChoice.value = ''
  }
}

async function goTo(next: BuilderStep) {
  mobileSummaryOpen.value = false
  stepHistory.value.push(step.value)
  step.value = next
  saveLocal()
  await router.replace({ query: { ...route.query, step: next, ...(draftId.value ? { draft: draftId.value } : {}) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function goBack() {
  mobileSummaryOpen.value = false
  const previous = stepHistory.value.pop()
  if (!previous) return
  step.value = previous
  saveLocal()
  await router.replace({ query: { ...route.query, step: previous, ...(draftId.value ? { draft: draftId.value } : {}) } })
}

function validateBrief() {
  briefErrors.title = title.value.trim() ? '' : 'Give your loop a title.'
  briefErrors.prompt = prompt.value.trim() ? '' : 'Describe what you want the loop to do.'
  return !briefErrors.title && !briefErrors.prompt
}

async function completeBrief() {
  if (!validateBrief()) return
  await goTo('flow')
}

async function completeFlow() {
  if (!flow.value) return
  await goTo('generators')
}

async function completePersonas(role: Role) {
  const minimum = role === 'generator' && flow.value === 'roundtable' ? 2 : 1
  if (selected[role].length < minimum) return
  modelIndex.value = 0
  await goTo(`${role}-models` as BuilderStep)
}

async function completeModel() {
  if (!currentAssignment.value || !modelRole.value) return
  if (modelIndex.value < selected[modelRole.value].length - 1) {
    modelIndex.value += 1
    saveLocal()
    return
  }

  if (modelRole.value === 'generator') {
    await goTo(flow.value === 'refinement' ? 'reviewers' : 'reviewer-gate')
  } else if (modelRole.value === 'reviewer') {
    await goTo(flow.value === 'roundtable' ? 'aggregator' : 'aggregator-gate')
  } else {
    await goTo('stop-conditions')
  }
}

async function completeReviewerGate() {
  if (!reviewerChoice.value) return
  if (reviewerChoice.value === 'yes') await goTo('reviewers')
  else await goTo(flow.value === 'roundtable' ? 'aggregator' : 'aggregator-gate')
}

async function completeAggregatorGate() {
  if (!aggregatorChoice.value) return
  if (aggregatorChoice.value === 'yes') await goTo('aggregator')
  else await goTo('stop-conditions')
}

async function continueCurrentStep() {
  if (step.value === 'brief') return completeBrief()
  if (step.value === 'flow') return completeFlow()
  if (step.value === 'generators') return completePersonas('generator')
  if (step.value === 'reviewers') return completePersonas('reviewer')
  if (step.value === 'aggregator') return completePersonas('aggregator')
  if (isModelStep.value) return completeModel()
  if (step.value === 'reviewer-gate') return completeReviewerGate()
  if (step.value === 'aggregator-gate') return completeAggregatorGate()
  if (step.value === 'stop-conditions') return goTo('review')
  return activateLoop()
}

function completeAgents() {
  return assignments.value.filter(assignment => (
    selected[assignment.role].includes(assignment.persona_id) && assignment.model_id
  ))
}

function serverState() {
  return {
    title: title.value.trim(),
    prompt: prompt.value.trim(),
    ...(flow.value ? { flow: flow.value } : {}),
    ...(hasStopCondition.value ? { stop_conditions: stopConditionsValue.value } : {}),
    agents: completeAgents(),
  }
}

async function persistDraft(): Promise<boolean> {
  if (!title.value.trim() || !prompt.value.trim()) {
    return false
  }
  try {
    const next = serverState()
    if (!draftId.value) {
      const created = await $fetch<LoopDraft>('/api/v1/loops', {
        method: 'POST',
        body: { ...next, status: 'draft' },
      })
      draftId.value = created.id
      await router.replace({ query: { ...route.query, draft: created.id, step: step.value } })
    } else {
      await $fetch(`/api/v1/loops/${encodeURIComponent(draftId.value)}`, { method: 'PATCH', body: next })
    }
    saveLocal()
    return true
  } catch {
    return false
  }
}

function saveLocal() {
  if (!import.meta.client) return
  localStorage.setItem(localKey, JSON.stringify({
    draftId: draftId.value,
    title: title.value,
    prompt: prompt.value,
    flow: flow.value,
    selected,
    assignments: assignments.value,
    stopConditions,
    reviewerChoice: reviewerChoice.value,
    aggregatorChoice: aggregatorChoice.value,
    step: step.value,
    stepHistory: stepHistory.value,
    modelIndex: modelIndex.value,
  }))
}

function restoreLocal() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(localKey)
  if (!raw) return
  try {
    const stored = JSON.parse(raw)
    draftId.value = stored.draftId || ''
    title.value = stored.title || ''
    prompt.value = stored.prompt || ''
    flow.value = stored.flow || ''
    selected.generator = stored.selected?.generator || []
    selected.reviewer = stored.selected?.reviewer || []
    selected.aggregator = stored.selected?.aggregator || []
    assignments.value = stored.assignments || []
    stopConditions.maxIterations = formatIntegerInput(stored.stopConditions?.maxIterations)
    stopConditions.maxTokens = formatIntegerInput(stored.stopConditions?.maxTokens)
    stopConditions.timeoutSeconds = formatIntegerInput(stored.stopConditions?.timeoutSeconds)
    reviewerChoice.value = stored.reviewerChoice || ''
    aggregatorChoice.value = stored.aggregatorChoice || ''
    step.value = stored.step || 'brief'
    stepHistory.value = stored.stepHistory || []
    modelIndex.value = stored.modelIndex || 0
  } catch {
    localStorage.removeItem(localKey)
  }
}

async function loadDraft(id: string) {
  const draft = await $fetch<LoopDraft>(`/api/v1/loops/${encodeURIComponent(id)}`)
  if (draft.status !== 'draft') {
    await router.replace(`/legacy/loops/${encodeURIComponent(id)}`)
    return
  }
  draftId.value = draft.id
  title.value = draft.title
  prompt.value = draft.prompt
  flow.value = draft.flow || ''
  selected.generator = draft.agents.filter(agent => agent.role === 'generator').map(agent => agent.persona_id)
  selected.reviewer = draft.agents.filter(agent => agent.role === 'reviewer').map(agent => agent.persona_id)
  selected.aggregator = draft.agents.filter(agent => agent.role === 'aggregator').map(agent => agent.persona_id)
  assignments.value = draft.agents.map(({ persona_id, model_id, role }) => ({ persona_id, model_id, role }))
  stopConditions.maxIterations = formatIntegerInput(draft.stop_conditions.max_iterations)
  stopConditions.maxTokens = formatIntegerInput(draft.stop_conditions.max_tokens)
  stopConditions.timeoutSeconds = formatIntegerInput(draft.stop_conditions.timeout_seconds)
}

async function leaveBuilder() {
  allowRouteLeave.value = true
  exitModalOpen.value = false
  await router.push(pendingDestination.value)
}

async function saveDraftAndLeave() {
  if (exitActionPending.value) return
  exitActionPending.value = true
  saveLocal()
  const saved = await persistDraft()
  exitActionPending.value = false
  if (saved) await leaveBuilder()
}

async function discardDraftAndLeave() {
  if (exitActionPending.value) return
  exitActionPending.value = true
  if (draftId.value) {
    try {
      await $fetch(`/api/v1/loops/${encodeURIComponent(draftId.value)}`, {
        method: 'DELETE',
      })
    } catch {
      // A missing or unreachable remote draft must not trap the user in the wizard.
    }
  }
  try {
    localStorage.removeItem(localKey)
    await leaveBuilder()
  } finally {
    exitActionPending.value = false
  }
}

async function activateLoop() {
  if (!flow.value || !hasStopCondition.value || completeAgents().length !== selected.generator.length + selected.reviewer.length + selected.aggregator.length) return
  activating.value = true
  try {
    const next = serverState()
    const activated = draftId.value
      ? await $fetch<LoopDraft>(`/api/v1/loops/${encodeURIComponent(draftId.value)}`, {
          method: 'PATCH',
          body: { ...next, status: 'active' },
        })
      : await $fetch<LoopDraft>('/api/v1/loops', {
          method: 'POST',
          body: { ...next, status: 'active' },
        })
    draftId.value = activated.id
    localStorage.removeItem(localKey)
    allowRouteLeave.value = true
    await router.push(`/legacy/loops/${encodeURIComponent(draftId.value)}`)
  } catch {
    // The final action owns API errors; the progress header never reports save state.
  } finally {
    activating.value = false
  }
}

function onBriefKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    void completeBrief()
  }
}

function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  if (!(target instanceof HTMLInputElement)) return false
  return !['checkbox', 'radio', 'button', 'submit'].includes(target.type)
}

function onBuilderKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || exitModalOpen.value || isTextEditingTarget(event.target)) return

  if (event.key === 'ArrowUp' && stepHistory.value.length) {
    event.preventDefault()
    void goBack()
    return
  }

  if (event.key === 'ArrowDown' && step.value !== 'review' && canContinue.value) {
    event.preventDefault()
    void continueCurrentStep()
    return
  }

  if (event.key === 'Enter' && step.value === 'review' && canContinue.value && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    void activateLoop()
  }
}

function toggleMobileSummary() {
  if (suppressSummaryButtonClick) {
    suppressSummaryButtonClick = false
    return
  }
  mobileSummaryOpen.value = !mobileSummaryOpen.value
}

function onSummaryButtonTouchStart(event: TouchEvent) {
  summaryButtonTouchStartY = event.touches[0]?.clientY ?? null
  suppressSummaryButtonClick = false
}

function onSummaryButtonTouchEnd(event: TouchEvent) {
  if (summaryButtonTouchStartY === null) return
  const endY = event.changedTouches[0]?.clientY ?? summaryButtonTouchStartY
  const distance = endY - summaryButtonTouchStartY
  summaryButtonTouchStartY = null
  if (Math.abs(distance) < 40) return
  mobileSummaryOpen.value = distance < 0
  suppressSummaryButtonClick = true
}

function onSummaryPanelTouchStart(event: TouchEvent) {
  summaryPanelTouchStartY = event.touches[0]?.clientY ?? null
  summaryPanelCanDismiss = event.currentTarget instanceof HTMLElement && event.currentTarget.scrollTop <= 0
}

function onSummaryPanelTouchEnd(event: TouchEvent) {
  if (summaryPanelTouchStartY === null) return
  const endY = event.changedTouches[0]?.clientY ?? summaryPanelTouchStartY
  const distance = endY - summaryPanelTouchStartY
  summaryPanelTouchStartY = null
  if (summaryPanelCanDismiss && distance > 56) mobileSummaryOpen.value = false
  summaryPanelCanDismiss = false
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

watch([title, prompt], saveLocal)
watch(stopConditions, saveLocal, { deep: true })
watch(showBuilderAside, (visible) => {
  if (!visible) mobileSummaryOpen.value = false
})
watch(mobileSummaryOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})

onMounted(async () => {
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('resize', measureNavigation)
  document.addEventListener('keydown', onBuilderKeydown)
  questionResizeObserver = new ResizeObserver(measureNavigation)
  if (questionRoot.value) questionResizeObserver.observe(questionRoot.value)
  measureNavigation()
  restoreLocal()
  const queryDraft = Array.isArray(route.query.draft) ? route.query.draft[0] : route.query.draft
  const queryStep = Array.isArray(route.query.step) ? route.query.step[0] : route.query.step
  if (typeof queryDraft === 'string') {
    try { await loadDraft(queryDraft) }
    catch { /* Keep the local wizard state available if the draft cannot be loaded. */ }
  }
  if (typeof queryStep === 'string') step.value = queryStep as BuilderStep
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
  questionResizeObserver?.disconnect()
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', measureNavigation)
  document.removeEventListener('keydown', onBuilderKeydown)
})

definePageMeta({ layout: 'app' })
useHead({ title: 'Create a loop · Looping Louie' })
</script>

<template>
  <UiContainer size="wide" class="loop-builder">
    <header class="loop-builder__topbar">
      <UiFormProgress :steps="steps" :current="macroStep" />
    </header>

    <div class="loop-builder__layout" :class="{ 'loop-builder__layout--team': showBuilderAside }">
      <main ref="questionRoot" class="loop-builder__question">
        <UiBreadcrumb :items="breadcrumbItems" class="loop-builder__breadcrumb" />
        <div v-if="optionsStatus === 'pending'" class="loop-builder__state">Loading your crew…</div>
        <div v-else-if="optionsError" class="loop-builder__state loop-builder__state--error">
          <span>Agents and models could not be loaded.</span>
          <UiButton variant="stroke" size="sm" @click="refreshOptions">Retry</UiButton>
        </div>

        <Transition v-else name="builder-question" mode="out-in">
          <section v-if="step === 'brief'" key="brief" class="builder-panel" @keydown="onBriefKeydown">
            <div class="builder-panel__heading">
              <h1>What do you want this loop to do?</h1>
              <p>Give your loop a clear name and the prompt your team will work from. You can refine everything later.</p>
            </div>
            <div class="builder-field-stage">
              <UiCollectionGroupTitle title="Title *" heading-as="h2" />
              <UiSectionStage inverse="bottom" class="builder-field-stage__stage">
                <UiTextField v-model="title" class="builder-field-stage__field" label="Title" hide-label placeholder="e.g. Review this launch plan" required :error="briefErrors.title" @input="briefErrors.title = ''" />
              </UiSectionStage>
            </div>
            <div class="builder-field-stage">
              <UiCollectionGroupTitle title="Prompt *" heading-as="h2" />
              <UiSectionStage inverse="bottom" class="builder-field-stage__stage">
                <UiTextField v-model="prompt" class="builder-field-stage__field" label="Prompt" hide-label multiline :rows="8" placeholder="Describe the goal, context, constraints, and what a good result looks like…" required :error="briefErrors.prompt" hint="Press Ctrl or Cmd + Enter to continue." @input="briefErrors.prompt = ''" />
              </UiSectionStage>
            </div>
          </section>

          <section v-else-if="step === 'flow'" key="flow" class="builder-panel">
            <div class="builder-panel__heading"><h1>How should your team work?</h1><p>Choose how answers move through your agents.</p></div>
            <div class="builder-flow-stage">
              <UiCollectionGroupTitle title="Loop flow" heading-as="h2" />
              <UiSectionStage inverse="bottom">
                <div class="builder-flow-options" role="radiogroup" aria-label="Loop flow">
                  <UiCard
                    v-for="option in flowOptions"
                    :key="option.value"
                    as="button"
                    type="button"
                    variant="row"
                    class="builder-flow-option ui-card--interactive"
                    :class="{
                      'builder-flow-option--selected': flow === option.value,
                      'builder-flow-option--confirming': confirmingFlow === option.value,
                    }"
                    role="radio"
                    :aria-checked="flow === option.value"
                    :disabled="Boolean(confirmingFlow)"
                    @click="chooseFlow(option.value)"
                  >
                    <template #title><h4>{{ option.title }}</h4></template>
                    <template #description><p>{{ option.description }}</p></template>
                    <template #trailing>
                      <span class="builder-flow-option__icon" aria-hidden="true">
                        <svg viewBox="0 0 256 256" fill="currentColor">
                          <path v-if="flow === option.value" d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                          <path v-else d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
                        </svg>
                      </span>
                    </template>
                  </UiCard>
                </div>
              </UiSectionStage>
            </div>
          </section>

          <section v-else-if="step === 'generators' || step === 'reviewers' || step === 'aggregator'" :key="step" class="builder-panel">
            <div v-if="step === 'generators'" class="builder-panel__heading"><h1>Who should work on your prompt?</h1><p>{{ flow === 'roundtable' ? 'Choose at least two agents to explore the prompt independently.' : flow === 'refinement' ? 'Choose one agent to create the first answer.' : 'Choose the agents you want to create the first answer.' }}</p></div>
            <div v-else-if="step === 'reviewers'" class="builder-panel__heading"><h1>Who should review the first answer?</h1><p>Choose agents who can check whether the output meets your expectations.</p></div>
            <div v-else class="builder-panel__heading"><h1>Who should combine the team’s work into one final answer?</h1><p>Choose a single agent to shape the final response.</p></div>
            <div class="builder-titled-stage">
              <UiCollectionGroupTitle :title="directoryStageTitle" heading-as="h2" />
              <UiSectionStage inverse="bottom" class="builder-agent-stage">
                <UiGrid :columns="2" gap="sm">
                  <UiDirectoryOption
                    v-for="persona in personas"
                    :key="persona.id"
                    :model-value="roleModelValue(step === 'generators' ? 'generator' : step === 'reviewers' ? 'reviewer' : 'aggregator')"
                    :value="persona.id"
                    :title="persona.name"
                    :description="personaQuestion(persona)"
                    :selection-type="step === 'aggregator' || (step === 'generators' && flow === 'refinement') ? 'radio' : 'checkbox'"
                    :name="step"
                    :external-href="`/app/personas/${encodeURIComponent(persona.id)}`"
                    @update:model-value="updateRoleSelection(step === 'generators' ? 'generator' : step === 'reviewers' ? 'reviewer' : 'aggregator', $event)"
                  >
                    <template #media><svg viewBox="0 0 256 256" fill="currentColor"><path :d="personaIcon(persona)" /></svg></template>
                  </UiDirectoryOption>
                </UiGrid>
              </UiSectionStage>
            </div>
          </section>

          <section v-else-if="isModelStep" :key="`${step}-${modelIndex}`" class="builder-panel">
            <div class="builder-panel__heading"><h1>Which model should {{ currentPersona?.name || 'this agent' }} use?</h1><p>You’ll choose a model for each selected agent. {{ modelIndex + 1 }} of {{ modelRole ? selected[modelRole].length : 0 }}.</p></div>
            <div class="builder-titled-stage">
              <UiCollectionGroupTitle :title="directoryStageTitle" heading-as="h2" />
              <UiSectionStage inverse="bottom" class="builder-agent-stage">
                <UiGrid :columns="2" gap="sm">
                  <UiDirectoryOption v-for="model in models" :key="model.id" :model-value="currentAssignment?.model_id || ''" :value="model.id" :title="model.name" :description="model.vendor" name="agent-model" :external-href="`/app/settings/models?model=${encodeURIComponent(model.id)}`" @update:model-value="chooseModel(String($event))">
                    <template #media>
                      <img v-if="modelLogo(model)" :src="modelLogo(model)" :alt="`${model.vendor} logo`">
                      <span v-else>{{ modelInitials(model) }}</span>
                    </template>
                  </UiDirectoryOption>
                </UiGrid>
              </UiSectionStage>
            </div>
          </section>

          <section v-else-if="step === 'reviewer-gate' || step === 'aggregator-gate'" :key="step" class="builder-panel builder-panel--compact">
            <div class="builder-panel__heading">
              <h1>{{ step === 'reviewer-gate' ? 'Would you like reviewers to check whether the output meets your expectations?' : 'Would you like one agent to combine the team’s work into a final answer?' }}</h1>
              <p>{{ step === 'reviewer-gate' ? 'Reviewers add an independent quality check before the final output.' : 'An aggregator is useful when several perspectives need one coherent response.' }}</p>
            </div>
            <div class="builder-flow-stage">
              <UiCollectionGroupTitle :title="step === 'reviewer-gate' ? 'Reviewers' : 'Aggregator'" heading-as="h2" />
              <UiSectionStage inverse="bottom">
                <div class="builder-flow-options" role="radiogroup" :aria-label="step === 'reviewer-gate' ? 'Add reviewers' : 'Add an aggregator'">
                  <UiCard
                    v-for="option in gateOptions"
                    :key="option.value"
                    as="button"
                    type="button"
                    variant="row"
                    class="builder-flow-option ui-card--interactive"
                    :class="{
                      'builder-flow-option--selected': currentGateChoice === option.value,
                      'builder-flow-option--confirming': confirmingGateChoice === option.value,
                    }"
                    role="radio"
                    :aria-checked="currentGateChoice === option.value"
                    :disabled="Boolean(confirmingGateChoice)"
                    @click="chooseGateChoice(option.value)"
                  >
                    <template #title><h4>{{ option.title }}</h4></template>
                    <template #description><p>{{ option.description }}</p></template>
                    <template #trailing>
                      <span class="builder-flow-option__icon" aria-hidden="true">
                        <svg viewBox="0 0 256 256" fill="currentColor">
                          <path v-if="currentGateChoice === option.value" d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                          <path v-else d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
                        </svg>
                      </span>
                    </template>
                  </UiCard>
                </div>
              </UiSectionStage>
            </div>
          </section>

          <section v-else-if="step === 'stop-conditions'" key="stop-conditions" class="builder-panel">
            <div class="builder-panel__heading"><h1>Give your loop a safety net</h1><p>These limits keep things under control if something goes wrong. Your loop will stop as soon as any configured condition is reached, so you can let it run with confidence.</p></div>
            <div class="builder-titled-stage">
              <UiCollectionGroupTitle title="Stop conditions" heading-as="h2" />
              <UiSectionStage inverse="bottom">
                <div class="builder-stop-conditions">
                  <UiCard as="label" variant="row" class="builder-stop-condition">
                    <template #title><h4>Max iterations</h4></template>
                    <template #description><p>Required. Choose at least one loop.</p></template>
                    <template #trailing>
                      <span class="builder-stop-condition__value">
                        <input :value="stopConditions.maxIterations" type="text" inputmode="numeric" pattern="[0-9,]*" aria-label="Maximum iterations" aria-required="true" required @input="updateStopCondition('maxIterations', $event)">
                        <small>loops</small>
                      </span>
                    </template>
                  </UiCard>
                  <UiCard as="label" variant="row" class="builder-stop-condition">
                    <template #title><h4>Tokens consumed</h4></template>
                    <template #description><p>Optional token budget for the complete run.</p></template>
                    <template #trailing>
                      <span class="builder-stop-condition__value">
                        <input :value="stopConditions.maxTokens" type="text" inputmode="numeric" pattern="[0-9,]*" aria-label="Maximum tokens consumed" @input="updateStopCondition('maxTokens', $event)">
                        <small>tokens</small>
                      </span>
                    </template>
                  </UiCard>
                  <UiCard as="label" variant="row" class="builder-stop-condition">
                    <template #title><h4>Timeout</h4></template>
                    <template #description><p>Optional wall-clock limit for the run.</p></template>
                    <template #trailing>
                      <span class="builder-stop-condition__value">
                        <input :value="stopConditions.timeoutSeconds" type="text" inputmode="numeric" pattern="[0-9,]*" aria-label="Timeout in seconds" @input="updateStopCondition('timeoutSeconds', $event)">
                        <small>seconds</small>
                      </span>
                    </template>
                  </UiCard>
                </div>
              </UiSectionStage>
            </div>
          </section>

          <section v-else key="review" class="builder-panel">
            <div class="builder-panel__heading"><h1>Your loop is ready</h1><p>Review the configuration before making it active. But don't worry, you can edit every field later.</p></div>
            <div class="builder-titled-stage">
              <UiCollectionGroupTitle title="Review" heading-as="h2" />
              <UiSectionStage inverse="bottom">
                <LoopTeamPreview
                  variant="review"
                  show-stop-conditions
                  :title="title"
                  :prompt="prompt"
                  :flow="flow"
                  :stop-conditions="stopConditionsValue"
                  :generators="previewMembers('generator')"
                  :reviewers="previewMembers('reviewer')"
                  :aggregators="previewMembers('aggregator')"
                  @edit-brief="goTo('brief')"
                  @edit-flow="goTo('flow')"
                  @edit-stop-conditions="goTo('stop-conditions')"
                  @edit-role="editPreviewRole"
                  @edit-model="editPreviewModel"
                  @remove="removePreviewMember"
                />
              </UiSectionStage>
            </div>
          </section>
        </Transition>

        <nav v-if="optionsStatus !== 'pending' && !optionsError" class="builder-navigation" :style="navigationStyle" aria-label="Form steps">
          <UiButton class="builder-navigation__back" variant="secondary" :disabled="stepHistory.length === 0" @click="goBack">
            Back <kbd aria-hidden="true">↑</kbd>
          </UiButton>
          <UiButton
            v-if="showBuilderAside"
            class="builder-summary-toggle"
            variant="stroke"
            :aria-expanded="mobileSummaryOpen"
            aria-controls="loop-builder-summary"
            @click="toggleMobileSummary"
            @touchstart.passive="onSummaryButtonTouchStart"
            @touchend="onSummaryButtonTouchEnd"
          >
            <template #leading>
              <svg v-if="mobileSummaryOpen" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M232,144a64.07,64.07,0,0,1-64,64H80a8,8,0,0,1,0-16h88a48,48,0,0,0,0-96H51.31l34.35,34.34a8,8,0,0,1-11.32,11.32l-48-48a8,8,0,0,1,0-11.32l48-48A8,8,0,0,1,85.66,45.66L51.31,80H168A64.07,64.07,0,0,1,232,144Z" /></svg>
              <svg v-else viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M213.66,194.34a8,8,0,0,1-11.32,11.32L128,131.31,53.66,205.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0Zm-160-68.68L128,51.31l74.34,74.35a8,8,0,0,0,11.32-11.32l-80-80a8,8,0,0,0-11.32,0l-80,80a8,8,0,0,0,11.32,11.32Z" /></svg>
            </template>
            {{ mobileSummaryOpen ? 'Back to wizard' : 'Summary' }}
          </UiButton>
          <UiButton class="builder-navigation__continue" :disabled="!canContinue" :loading="activating" @click="continueCurrentStep">
            {{ step === 'review' ? 'Activate new loop' : 'Continue' }}
            <kbd aria-hidden="true">{{ step === 'review' ? 'Ctrl/⌘ ↵' : '↓' }}</kbd>
          </UiButton>
        </nav>
      </main>

      <LoopTeamPreview
        v-if="showBuilderAside"
        id="loop-builder-summary"
        :class="{ 'loop-team-preview--mobile-open': mobileSummaryOpen }"
        show-stop-conditions
        :title="title"
        :prompt="prompt"
        :flow="flow"
        :stop-conditions="stopConditionsValue"
        :generators="previewMembers('generator')"
        :reviewers="previewMembers('reviewer')"
        :aggregators="previewMembers('aggregator')"
        @edit-brief="goTo('brief')"
        @edit-flow="goTo('flow')"
        @edit-stop-conditions="goTo('stop-conditions')"
        @edit-role="editPreviewRole"
        @edit-model="editPreviewModel"
        @remove="removePreviewMember"
        @touchstart.passive="onSummaryPanelTouchStart"
        @touchend="onSummaryPanelTouchEnd"
      />
    </div>

    <UiModal
      v-model:open="exitModalOpen"
      title="Leave this loop unfinished?"
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
        <UiButton data-autofocus :loading="exitActionPending" :disabled="!title.trim() || !prompt.trim()" @click="saveDraftAndLeave">
          Save draft
        </UiButton>
      </template>
    </UiModal>
  </UiContainer>
</template>

<style scoped>
.loop-builder { padding-block: var(--ll-space-6) var(--ll-space-16); }
.loop-builder__breadcrumb { margin-bottom: var(--ll-space-5); }
.loop-builder__topbar { width: calc(100% + var(--ui-container-gutter)); margin-bottom: var(--ll-space-10); }
.loop-builder__layout { max-width: 52rem; }
.loop-builder__layout--team { display: grid; max-width: none; grid-template-columns: minmax(0, 52rem) minmax(17rem, 21rem); align-items: start; gap: var(--ll-space-10); }
.loop-builder__question { min-width: 0; padding-bottom: 7rem; }
.loop-builder__state { display: flex; min-height: 20rem; align-items: center; justify-content: center; gap: var(--ll-space-3); color: var(--ll-color-text-muted); }
.loop-builder__state--error { color: var(--ll-color-brand-ink); }
.builder-panel { display: grid; gap: var(--ll-space-6); }
.builder-panel--compact { max-width: 48rem; }
.builder-panel__heading { display: grid; max-width: 48rem; gap: var(--ll-space-3); }
.builder-panel__heading h1 { max-width: 17ch; margin: 0; color: var(--ll-color-ink); font: 550 clamp(2rem, 4vw, 3.5rem) / 1.02 var(--ll-font-display); letter-spacing: -0.04em; }
.builder-panel__heading p { max-width: 42rem; margin: 0; color: var(--ll-color-text-muted); font-size: 1.05rem; line-height: 1.55; }
.builder-field-stage { min-width: 0; }
.builder-panel :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }
.builder-titled-stage { min-width: 0; }
.builder-flow-stage { min-width: 0; }
.builder-flow-options { display: grid; gap: var(--ll-space-3); }
.builder-flow-option {
  width: 100%;
  appearance: none;
  font: inherit;
  text-align: left;
}
.builder-flow-option:disabled { cursor: default; }
.builder-flow-option :deep(.ui-card__description) {
  margin-top: 0;
  font-size: var(--ll-text-md);
}
.builder-flow-option__icon {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--ll-color-text-muted);
  transition: color var(--ll-duration-normal) var(--ll-ease-out);
}
.builder-flow-option__icon svg { display: block; width: 100%; height: 100%; }
.builder-flow-option:is(:hover, :focus-visible) .builder-flow-option__icon,
.builder-flow-option--selected .builder-flow-option__icon { color: var(--ll-color-primary); }
.builder-flow-option--confirming { animation: builder-flow-radio-confirm 520ms ease-in-out both; pointer-events: none; }
.builder-agent-stage :deep(.ui-directory-option) { border-radius: var(--ll-radius-pill); }
.builder-agent-stage :deep(.ui-directory-option.ui-directory-option--selected) {
  color: var(--ll-color-metal-025);
  background: var(--ll-color-primary);
  border-color: var(--ll-color-primary-depth);
}
.builder-agent-stage :deep(.ui-directory-option.ui-directory-option--selected .ui-directory-option__copy strong),
.builder-agent-stage :deep(.ui-directory-option.ui-directory-option--selected .ui-directory-option__copy > span) {
  color: var(--ll-color-metal-025);
}
.builder-agent-stage :deep(.ui-directory-option.ui-directory-option--selected .ui-directory-option__check) {
  color: var(--ll-color-primary);
  background: var(--ll-color-metal-025);
}
.builder-stop-conditions { display: grid; gap: var(--ll-space-3); }
.builder-stop-condition { cursor: text; }
.builder-stop-condition :deep(.ui-card__description) { margin-top: 0; }
.builder-stop-condition__value { display: flex; align-items: center; gap: var(--ll-space-2); }
.builder-stop-condition__value input {
  width: 7rem;
  padding: var(--ll-space-2) var(--ll-space-3);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-mono);
  text-align: right;
}
.builder-stop-condition__value input:focus-visible { border-color: var(--ll-color-primary); outline: 2px solid var(--ll-color-primary); outline-offset: 1px; }
.builder-stop-condition__value small { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
.builder-navigation { position: fixed; z-index: 40; bottom: var(--ll-space-4); display: flex; box-sizing: border-box; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding-block: var(--ll-space-8) max(var(--ll-space-3), env(safe-area-inset-bottom)); background: linear-gradient(180deg, transparent 0, color-mix(in srgb, var(--ll-color-canvas) 94%, transparent) 28%, var(--ll-color-canvas) 58%); }
.builder-navigation > :last-child { margin-left: auto; }
.builder-summary-toggle { display: none; }
.builder-navigation__back :deep(.ui-button__label),
.builder-navigation__continue :deep(.ui-button__label) { display: inline-flex; align-items: center; line-height: 1; }
.builder-navigation kbd { display: inline-grid; min-width: 1.35rem; height: 1.35rem; box-sizing: border-box; place-items: center; padding-inline: 0.3rem; margin-left: var(--ll-space-2); color: currentColor; background: color-mix(in srgb, currentColor 8%, transparent); border: 1px solid color-mix(in srgb, currentColor 22%, transparent); border-radius: var(--ll-radius-sm); font: 600 0.6875rem / 1 var(--ll-font-mono); box-shadow: 0 1px 0 color-mix(in srgb, currentColor 20%, transparent); white-space: nowrap; }
.builder-question-enter-active, .builder-question-leave-active { transition: opacity 150ms ease, transform 180ms var(--ll-ease-out); }
.builder-question-enter-from { opacity: 0; transform: translateY(0.75rem); }
.builder-question-leave-to { opacity: 0; transform: translateY(-0.5rem); }
@keyframes builder-flow-radio-confirm {
  0%, 42%, 84%, 100% { background: var(--ll-color-card); }
  21%, 63% { background: transparent; }
}
@media (max-width: 62rem) { .loop-builder__layout--team { grid-template-columns: 1fr; } .loop-builder__layout--team :deep(.loop-team-preview) { position: static; order: -1; } }
@media (max-width: 44rem) {
  .loop-builder { padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)); }
  .builder-stop-condition :deep(.ui-card__content) { align-items: flex-start; }
  .builder-stop-condition :deep(.ui-card__footer) { width: 100%; }
  .builder-stop-condition__value { width: 100%; }
  .builder-stop-condition__value input { margin-left: auto; }
  .builder-navigation { z-index: 330; bottom: 0; display: grid; grid-template-columns: 1fr auto 1fr; gap: var(--ll-space-2); }
  .builder-navigation > :last-child { margin-left: 0; }
  .builder-navigation__back { grid-column: 1; justify-self: start; }
  .builder-summary-toggle { display: inline-flex; grid-column: 2; justify-self: center; }
  .builder-navigation__continue { grid-column: 3; justify-self: end; }
  .builder-navigation :deep(.ui-button) { --ui-button-height: 1.75rem; --ui-button-padding: 0.5rem; --ui-button-font-size: 0.75rem; gap: 0.375rem; }
  .builder-navigation kbd { min-width: 1.1rem; height: 1.1rem; padding-inline: 0.2rem; margin-left: var(--ll-space-1); font-size: 0.625rem; }
  .loop-builder__layout--team :deep(.loop-team-preview) {
    position: fixed;
    inset: 0;
    z-index: 320;
    overflow-y: auto;
    box-sizing: border-box;
    padding: var(--ll-space-8) var(--ll-space-6) calc(6rem + env(safe-area-inset-bottom));
    visibility: hidden;
    opacity: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    transform: translateY(100%);
    transition: opacity var(--ll-duration-normal) var(--ll-ease-out), transform var(--ll-duration-normal) var(--ll-ease-out), visibility 0s linear var(--ll-duration-normal);
    pointer-events: none;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }
  .loop-builder__layout--team :deep(.loop-team-preview.loop-team-preview--mobile-open) {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0s;
    pointer-events: auto;
  }
}
@media (prefers-reduced-motion: reduce) { .builder-question-enter-active, .builder-question-leave-active { transition: none; } .builder-flow-option--confirming { animation: none; } }
</style>
