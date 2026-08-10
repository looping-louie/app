<script setup lang="ts">
import type { LoopStopConditions } from '~/composables/useLoopStopConditions'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'

interface LoopAgent {
  id?: string
  model_id: string
  persona_id: string
  role: string
}

interface LoopOutputContract {
  type: string
  description: string
  files: string[]
  schema: Record<string, unknown> | null
}

interface LoopDetail {
  id: string
  title: string
  description: string
  prompt: string
  flow: string | null
  status: string
  stop_conditions: LoopStopConditions | null
  agents: LoopAgent[]
  output_contract: LoopOutputContract | null
  created_at: string
  created_by: string
}

interface DetailRow {
  id: string
  title: string
  description?: string
  values?: string[]
  detail?: string
  kind?: 'standard' | 'agents' | 'schema' | 'prompt' | 'created'
  [key: string]: unknown
}

interface PersonaSummary {
  id: string
  name: string
  enabled: boolean
}

interface PersonaListResponse {
  items: PersonaSummary[]
  total: number
}

interface ModelSummary {
  id: string
  name: string
  available: boolean
}

interface ModelListResponse {
  items: ModelSummary[]
  total: number
}

interface AgentDraft {
  clientId: string
  id?: string
  role: string
  persona_id: string
  model_id: string
}

type EditableField = 'status' | 'flow' | 'stop-condition' | 'agents' | 'prompt' | 'type' | 'files' | 'schema'
type StopConditionKey = 'max_iterations' | 'max_tokens' | 'timeout_seconds'
type LoopPatch = Partial<Pick<LoopDetail, 'status' | 'prompt' | 'flow' | 'stop_conditions' | 'agents' | 'output_contract'>>

interface ApiErrorEnvelope {
  error?: {
    message?: string
  }
}

const route = useRoute()
const loopId = computed(() => String(route.params.id))
const { formatMarkdown } = useMarkdown()
const { formatDate } = useDateTime()
const { formatLoopStopConditions } = useLoopStopConditions()
const { modelLogo } = useModelLogo()
const { personaIcon } = usePersonaIcon()
const editingField = ref<EditableField | null>(null)
const savingField = ref<EditableField | null>(null)
const editError = ref('')
const statusDraft = ref('active')
const flowDraft = ref('direct')
const stopDraft = ref<Record<StopConditionKey, string>>({
  max_iterations: '',
  max_tokens: '',
  timeout_seconds: '',
})
const outputTypeDraft = ref('text')
const outputFilesDraft = ref('tasks.json')
const promptDraft = ref('')
const schemaDraft = ref('')
const agentDrafts = ref<AgentDraft[]>([])
const personaOptions = ref<{ value: string; label: string }[]>([])
const modelOptions = ref<{ value: string; label: string }[]>([])
const loadingAgentOptions = ref(false)
let agentDraftCounter = 0
let promptSaveTimer: ReturnType<typeof setTimeout> | undefined
let schemaSaveTimer: ReturnType<typeof setTimeout> | undefined

const statusOptions = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
  { value: 'archive', label: 'archive' },
]

const flowOptions = [
  { value: 'direct', label: 'direct' },
  { value: 'refinement', label: 'refinement' },
  { value: 'roundtable', label: 'roundtable' },
]

const maxIterationOptions = Array.from({ length: 9 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}))

const maxTokenOptions = [
  { value: '', label: 'None' },
  ...[1000, 5000, 10000, 50000, 100000, 500000, 1000000].map(value => ({
    value: String(value),
    label: value.toLocaleString('en-US'),
  })),
]

const timeoutOptions = [
  { value: '', label: 'None' },
  ...[60, 300, 600, 1800, 3600, 10800, 21600, 43200, 86400].map(value => ({
    value: String(value),
    label: value.toLocaleString('en-US'),
  })),
]

const roleOptions = [
  { value: 'generator', label: 'Generator' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'aggregator', label: 'Aggregator' },
]

const outputTypeOptions = [
  { value: 'text', label: 'text' },
  { value: 'files', label: 'files' },
]

const outputFileOptions = [
  { value: 'tasks.json', label: 'tasks.json' },
  { value: 'ideas.md', label: 'ideas.md' },
]

const { data: loop, status, error, refresh } = await useAsyncData(
  () => `loop-${loopId.value}`,
  () => $fetch<LoopDetail>(`/api/v1/loops/${encodeURIComponent(loopId.value)}`),
)

const breadcrumbItems = computed(() => loop.value ? [
  { label: titleCase('loops'), to: '/app/loops' },
  {
    label: titleCase(flowFromApi(loop.value.flow)),
    to: `/app/loops?flow=${encodeURIComponent(flowFromApi(loop.value.flow))}`,
  },
] : [])

const basicsItems = computed<DetailRow[]>(() => loop.value ? [
  { id: 'status', title: 'Status', description: statusFromApi(loop.value.status) },
  { id: 'flow', title: 'Flow', description: flowFromApi(loop.value.flow) },
  {
    id: 'stop-condition',
    title: 'Stop condition',
    description: formatLoopStopConditions(loop.value.stop_conditions) || 'None',
  },
] : [])

const formattedPrompt = computed(() => formatMarkdown(loop.value?.prompt))

const outputItems = computed<DetailRow[]>(() => {
  const rows: DetailRow[] = [
    {
      id: 'prompt',
      title: 'Prompt',
      detail: formattedPrompt.value,
      kind: 'prompt',
    },
  ]
  const contract = loop.value?.output_contract
  if (!contract) return rows
  rows.push(
    { id: 'type', title: 'Output type', description: contract.type, kind: 'standard' },
    {
      id: 'files',
      title: 'Output files',
      description: contract.files.join(', ') || 'None',
      values: contract.files.length ? contract.files : ['None'],
      kind: 'standard',
    },
  )

  if (contract.schema != null) {
    rows.push({
      id: 'schema',
      title: 'Output schema',
      detail: JSON.stringify(contract.schema, null, 2),
      kind: 'schema',
    })
  }

  return rows
})

const detailItems = computed<DetailRow[]>(() => {
  const rows: DetailRow[] = [
    ...basicsItems.value,
    { id: 'agents', title: 'Agents', kind: 'agents' },
    ...outputItems.value,
  ]

  if (loop.value) rows.push({ id: 'created', title: 'Created', kind: 'created' })
  return rows
})

const creatorLabel = computed(() => (
  loop.value?.created_by === 'system:catalog'
    ? 'Looping Louie'
    : loop.value?.created_by ?? ''
))

const creatorImage = computed(() => (
  loop.value?.created_by === 'system:catalog'
    ? '/brand/twemoji-small-airplane.svg'
    : undefined
))

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function personaLabel(value: unknown): string {
  return textValue(value).replace(/^builtin:persona:/, '')
}

function personaIconPath(value: unknown): string {
  const id = textValue(value)
  return personaIcon({ id, source_instruction_id: id })
}

function modelLogoPath(value: unknown): string {
  return modelLogo(textValue(value))
}

function titleCase(value: unknown): string {
  return textValue(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function statusFromApi(value: string): string {
  return {
    disabled: 'inactive',
    archived: 'archive',
  }[value] ?? value
}

function statusToApi(value: string): string {
  return {
    inactive: 'disabled',
    archive: 'archived',
  }[value] ?? value
}

function flowFromApi(value: string | null): string {
  if (!value) return 'draft'
  return value
}

function flowToApi(value: string): string {
  return value
}

function isEditableField(value: unknown): value is EditableField {
  return typeof value === 'string' && [
    'status',
    'flow',
    'stop-condition',
    'agents',
    'prompt',
    'type',
    'files',
    'schema',
  ].includes(value)
}

function selectedValue(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? '') : value
}

function newAgentDraft(agent?: LoopAgent): AgentDraft {
  agentDraftCounter += 1
  return {
    clientId: `agent-draft-${agentDraftCounter}`,
    ...(agent?.id ? { id: agent.id } : {}),
    role: agent?.role ?? '',
    persona_id: agent?.persona_id ?? '',
    model_id: agent?.model_id ?? '',
  }
}

function agentDraftIsComplete(agent: AgentDraft): boolean {
  return Boolean(agent.role && agent.persona_id && agent.model_id)
}

function ensureTrailingAgentDraft() {
  if (!agentDrafts.value.length || agentDraftIsComplete(agentDrafts.value.at(-1)!)) {
    agentDrafts.value.push(newAgentDraft())
  }
}

async function loadAgentOptions() {
  if ((personaOptions.value.length && modelOptions.value.length) || loadingAgentOptions.value) return

  loadingAgentOptions.value = true
  try {
    const [personas, models] = await Promise.all([
      $fetch<PersonaListResponse>('/api/v1/personas'),
      $fetch<ModelListResponse>('/api/v1/models?available=true'),
    ])
    personaOptions.value = personas.items
      .filter(persona => persona.enabled)
      .map(persona => ({ value: persona.id, label: persona.name }))
    modelOptions.value = models.items
      .filter(model => model.available)
      .map(model => ({ value: model.id, label: model.name }))
  } catch (cause) {
    editError.value = apiErrorMessage(cause)
  } finally {
    loadingAgentOptions.value = false
  }
}

function beginEdit(field: EditableField) {
  if (!loop.value || savingField.value) return

  editError.value = ''
  statusDraft.value = statusFromApi(loop.value.status)
  flowDraft.value = flowFromApi(loop.value.flow)
  stopDraft.value = {
    max_iterations: loop.value.stop_conditions?.max_iterations?.toString() ?? '',
    max_tokens: loop.value.stop_conditions?.max_tokens?.toString() ?? '',
    timeout_seconds: loop.value.stop_conditions?.timeout_seconds?.toString() ?? '',
  }
  outputTypeDraft.value = loop.value.output_contract?.type ?? 'text'
  outputFilesDraft.value = loop.value.output_contract?.files[0] ?? 'tasks.json'
  promptDraft.value = loop.value.prompt
  schemaDraft.value = loop.value.output_contract?.schema == null
    ? ''
    : JSON.stringify(loop.value.output_contract.schema, null, 2)
  agentDrafts.value = loop.value.agents.map(agent => newAgentDraft(agent))
  ensureTrailingAgentDraft()
  editingField.value = field

  if (field === 'agents') void loadAgentOptions()
}

function apiErrorMessage(cause: unknown): string {
  const data = (cause as { data?: ApiErrorEnvelope } | null)?.data
  return data?.error?.message
    ?? (cause instanceof Error ? cause.message : 'The loop could not be updated.')
}

async function patchLoop(payload: LoopPatch, field: EditableField): Promise<boolean> {
  if (!loop.value || savingField.value) return false

  savingField.value = field
  editError.value = ''

  try {
    loop.value = await $fetch<LoopDetail>(
      `/api/v1/loops/${encodeURIComponent(loopId.value)}`,
      {
        method: 'PATCH',
        body: payload,
      },
    )
    return true
  } catch (cause) {
    editError.value = apiErrorMessage(cause)
    return false
  } finally {
    savingField.value = null
  }
}

async function selectStatus(value: string | string[]) {
  if (!loop.value || savingField.value) return
  const candidate = selectedValue(value)
  const previous = statusDraft.value
  statusDraft.value = candidate
  if (statusToApi(candidate) === loop.value.status) return
  if (!await patchLoop({ status: statusToApi(candidate) }, 'status')) statusDraft.value = previous
}

async function selectFlow(value: string | string[]) {
  if (!loop.value || savingField.value) return
  const candidate = selectedValue(value)
  const previous = flowDraft.value
  flowDraft.value = candidate
  if (flowToApi(candidate) === loop.value.flow) return
  if (!await patchLoop({ flow: flowToApi(candidate) }, 'flow')) flowDraft.value = previous
}

function stopConditionsFromDraft(draft: Record<StopConditionKey, string>): LoopStopConditions {
  return {
    max_iterations: draft.max_iterations ? Number(draft.max_iterations) : null,
    max_tokens: draft.max_tokens ? Number(draft.max_tokens) : null,
    timeout_seconds: draft.timeout_seconds ? Number(draft.timeout_seconds) : null,
  }
}

async function selectStopCondition(key: StopConditionKey, value: string | string[]) {
  if (savingField.value) return
  const previous = stopDraft.value
  const candidate = { ...previous, [key]: selectedValue(value) }
  const payload = stopConditionsFromDraft(candidate)
  if (Object.values(payload).every(condition => condition == null)) {
    editError.value = 'At least one stop condition is required.'
    return
  }

  stopDraft.value = candidate
  editError.value = ''
  if (!await patchLoop({ stop_conditions: payload }, 'stop-condition')) stopDraft.value = previous
}

function outputContractPayload(overrides: Partial<LoopOutputContract> = {}): LoopOutputContract | null {
  if (!loop.value?.output_contract) return null
  return {
    type: loop.value.output_contract.type,
    description: loop.value.output_contract.description,
    files: [...loop.value.output_contract.files],
    schema: loop.value.output_contract.schema,
    ...overrides,
  }
}

async function selectOutputType(value: string | string[]) {
  if (!loop.value?.output_contract || savingField.value) return
  const candidate = selectedValue(value)
  const previous = outputTypeDraft.value
  outputTypeDraft.value = candidate
  if (candidate === loop.value.output_contract.type) return
  const contract = outputContractPayload({
    type: candidate,
    files: candidate === 'files' && !loop.value.output_contract.files.length
      ? ['tasks.json']
      : loop.value.output_contract.files,
  })
  if (!contract || !await patchLoop({ output_contract: contract }, 'type')) outputTypeDraft.value = previous
}

async function selectOutputFile(value: string | string[]) {
  if (!loop.value?.output_contract || savingField.value) return
  const candidate = selectedValue(value)
  const previous = outputFilesDraft.value
  outputFilesDraft.value = candidate
  if (loop.value.output_contract.files.length === 1 && loop.value.output_contract.files[0] === candidate) return
  const contract = outputContractPayload({ files: [candidate] })
  if (!contract || !await patchLoop({ output_contract: contract }, 'files')) outputFilesDraft.value = previous
}

async function setAgentRole(index: number, value: string | string[]) {
  const agent = agentDrafts.value[index]
  if (!agent || savingField.value) return
  const candidate = selectedValue(value)
  if (candidate === agent.role) return
  const previous = agent.role
  agent.role = candidate
  if (agentDraftIsComplete(agent) && !await persistAgents()) agent.role = previous
}

async function setAgentPersona(index: number, value: string | string[]) {
  const agent = agentDrafts.value[index]
  if (!agent || savingField.value) return
  const candidate = selectedValue(value)
  if (candidate === agent.persona_id) return
  const previous = agent.persona_id
  agent.persona_id = candidate
  if (agentDraftIsComplete(agent) && !await persistAgents()) agent.persona_id = previous
}

async function setAgentModel(index: number, value: string | string[]) {
  const agent = agentDrafts.value[index]
  if (!agent || savingField.value) return
  const candidate = selectedValue(value)
  if (candidate === agent.model_id) return
  const previous = agent.model_id
  agent.model_id = candidate
  if (!agentDraftIsComplete(agent)) return
  if (await persistAgents()) ensureTrailingAgentDraft()
  else agent.model_id = previous
}

function personaOptionLabel(id: string): string {
  return personaOptions.value.find(option => option.value === id)?.label ?? personaLabel(id)
}

function modelOptionLabel(id: string): string {
  return modelOptions.value.find(option => option.value === id)?.label ?? id
}

async function persistAgents(): Promise<boolean> {
  const agents = agentDrafts.value
    .filter(agentDraftIsComplete)
    .map(agent => ({
      ...(agent.id ? { id: agent.id } : {}),
      role: agent.role,
      persona_id: agent.persona_id,
      model_id: agent.model_id,
    })) as LoopAgent[]

  return patchLoop({ agents }, 'agents')
}

async function removeAgent(index: number) {
  if (savingField.value) return
  const previous = agentDrafts.value.map(agent => ({ ...agent }))
  const [removed] = agentDrafts.value.splice(index, 1)
  ensureTrailingAgentDraft()
  if (!removed || !agentDraftIsComplete(removed)) return
  if (!await persistAgents()) agentDrafts.value = previous
}

async function persistPrompt(value = promptDraft.value) {
  promptSaveTimer = undefined
  if (savingField.value) {
    promptSaveTimer = setTimeout(() => void persistPrompt(value), 300)
    return
  }

  const nextPrompt = value.trim()
  if (!nextPrompt) {
    editError.value = 'Prompt cannot be empty.'
    return
  }
  if (nextPrompt === loop.value?.prompt) {
    return
  }
  await patchLoop({ prompt: nextPrompt }, 'prompt')
}

async function persistSchema(value = schemaDraft.value) {
  schemaSaveTimer = undefined
  if (savingField.value) {
    schemaSaveTimer = setTimeout(() => void persistSchema(value), 300)
    return
  }

  let schema: Record<string, unknown>
  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    schema = parsed as Record<string, unknown>
  } catch {
    editError.value = 'Schema must be a valid JSON object.'
    return
  }

  if (JSON.stringify(schema) === JSON.stringify(loop.value?.output_contract.schema)) {
    return
  }
  const contract = outputContractPayload({ schema })
  if (contract) await patchLoop({ output_contract: contract }, 'schema')
}

function schedulePromptSave() {
  if (promptSaveTimer) clearTimeout(promptSaveTimer)
  const value = promptDraft.value
  promptSaveTimer = setTimeout(() => void persistPrompt(value), 700)
}

function scheduleSchemaSave() {
  if (schemaSaveTimer) clearTimeout(schemaSaveTimer)
  const value = schemaDraft.value
  schemaSaveTimer = setTimeout(() => void persistSchema(value), 700)
}

function handleAction(value: unknown) {
  if (!isEditableField(value) || savingField.value) return
  beginEdit(value)
}

function closeEditing() {
  const field = editingField.value
  if (!field) return

  if (field === 'prompt' && promptSaveTimer) {
    clearTimeout(promptSaveTimer)
    promptSaveTimer = undefined
    void persistPrompt()
  }
  if (field === 'schema' && schemaSaveTimer) {
    clearTimeout(schemaSaveTimer)
    schemaSaveTimer = undefined
    void persistSchema()
  }

  editingField.value = null
  editError.value = ''
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!editingField.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-loop-editor]')) return
  closeEditing()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  if (promptSaveTimer) clearTimeout(promptSaveTimer)
  if (schemaSaveTimer) clearTimeout(schemaSaveTimer)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})

definePageMeta({
  layout: 'app',
})

useHead(() => ({
  title: loop.value
    ? `${loop.value.title} · Loops · Looping Louie`
    : 'Loop · Looping Louie',
}))
</script>

<template>
  <UiContainer size="wide" class="loop-page">
    <div v-if="status === 'pending'" class="loop-state" role="status">Loading loop…</div>
    <div v-else-if="error" class="loop-state loop-state--error" role="alert">
      <span>Loop could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="refresh">Retry</UiButton>
    </div>

    <template v-else-if="loop">
      <UiBreadcrumb class="loop-breadcrumb" :items="breadcrumbItems" />

      <UiHeadingBlock layout="split" size="section" align="start" class="loop-heading">
        <template #title>
          <h1>{{ loop.title }}</h1>
        </template>
        <template #description>
          <p>{{ loop.description }}</p>
        </template>
        <template #aside>
          <div class="loop-actions">
            <UiButton type="button">Run</UiButton>
            <UiButton
              type="button"
              variant="secondary"
              dropdown
              dropdown-align="right"
              icon-only
              aria-label="More loop actions"
              dropdown-label="Loop actions"
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

      <section class="loop-details" aria-label="Loop configuration">
        <UiSectionStage inverse="bottom" class="loop-details-stage">
          <UiGridList
            :items="detailItems"
            variant="key-value"
            aria-label="Loop configuration"
            class="loop-details-grid"
          >
            <template #leading="{ item }">
              <h4>{{ item.title }}</h4>
            </template>

            <template #metadata="{ item }">
              <div
                v-if="item.id === 'status'"
                class="basic-editor"
                :data-loop-editor="editingField === 'status' ? '' : undefined"
              >
                <UiPill
                  v-if="editingField === 'status'"
                  :model-value="statusDraft"
                  clickable
                  selection-type="radio"
                  :options="statusOptions"
                  aria-label="Choose loop status"
                  dropdown-label="Status"
                  @update:model-value="selectStatus"
                >
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
                    </svg>
                  </template>
                  {{ statusDraft }}
                </UiPill>
                <UiPill v-else>{{ item.description }}</UiPill>
              </div>

              <div
                v-else-if="item.id === 'flow'"
                class="basic-editor"
                :data-loop-editor="editingField === 'flow' ? '' : undefined"
              >
                <UiPill
                  v-if="editingField === 'flow'"
                  :model-value="flowDraft"
                  clickable
                  selection-type="radio"
                  :options="flowOptions"
                  aria-label="Choose loop flow"
                  dropdown-label="Flow"
                  @update:model-value="selectFlow"
                >
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                      <path d="M253.93,154.63c-1.32-1.46-24.09-26.22-61-40.56-1.72-18.42-8.46-35.17-19.41-47.92C158.87,49,137.58,40,112,40,60.48,40,26.89,86.18,25.49,88.15a8,8,0,0,0,13,9.31C38.8,97.05,68.81,56,112,56c20.77,0,37.86,7.11,49.41,20.57,7.42,8.64,12.44,19.69,14.67,32A140.87,140.87,0,0,0,140.6,104c-26.06,0-47.93,6.81-63.26,19.69C63.78,135.09,56,151,56,167.25A47.59,47.59,0,0,0,69.87,201.3c9.66,9.62,23.06,14.7,38.73,14.7,51.81,0,81.18-42.13,84.49-84.42a161.43,161.43,0,0,1,49,33.79,8,8,0,1,0,11.86-10.74Zm-94.46,21.64C150.64,187.09,134.66,200,108.6,200,83.32,200,72,183.55,72,167.25,72,144.49,93.47,120,140.6,120a124.34,124.34,0,0,1,36.78,5.68C176.93,144.44,170.46,162.78,159.47,176.27Z" />
                    </svg>
                  </template>
                  {{ flowDraft }}
                </UiPill>
                <UiPill v-else>{{ item.description }}</UiPill>
              </div>

              <template v-else-if="item.id === 'stop-condition'">
                <div v-if="editingField === 'stop-condition'" class="stop-condition-editor" data-loop-editor>
                  <UiPill
                    :model-value="stopDraft.max_iterations"
                    clickable
                    :options="maxIterationOptions"
                    dropdown-label="Maximum iterations"
                    aria-label="Choose maximum iterations"
                    @update:model-value="selectStopCondition('max_iterations', $event)"
                  >
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                        <path d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z" />
                      </svg>
                    </template>
                    {{ stopDraft.max_iterations ? `${stopDraft.max_iterations} loops` : 'Max iterations' }}
                  </UiPill>
                  <UiPill
                    :model-value="stopDraft.max_tokens"
                    clickable
                    :options="maxTokenOptions"
                    dropdown-label="Maximum tokens"
                    aria-label="Choose maximum tokens"
                    @update:model-value="selectStopCondition('max_tokens', $event)"
                  >
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                        <path d="M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57ZM232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37C170.49,151.77,184,139,184,124V105.74C213.87,110.19,232,122.27,232,132ZM72,150.25V126.46A183.74,183.74,0,0,0,96,128a183.74,183.74,0,0,0,24-1.54v23.79A163,163,0,0,1,96,152,163,163,0,0,1,72,150.25Zm96-40.32V124c0,8.39-12.41,17.4-32,22.87V123.5C148.91,120.37,159.84,115.71,168,109.93ZM96,56c41.21,0,72,14.78,72,28s-30.79,28-72,28S24,97.22,24,84,54.79,56,96,56ZM24,124V109.93c8.16,5.78,19.09,10.44,32,13.57v23.37C36.41,141.4,24,132.39,24,124Zm64,48v-4.17c2.63.1,5.29.17,8,.17,3.88,0,7.67-.13,11.39-.35A121.92,121.92,0,0,0,120,171.41v23.46C100.41,189.4,88,180.39,88,172Zm48,26.25V174.4a179.48,179.48,0,0,0,24,1.6,183.74,183.74,0,0,0,24-1.54v23.79a165.45,165.45,0,0,1-48,0Zm64-3.38V171.5c12.91-3.13,23.84-7.79,32-13.57V172C232,180.39,219.59,189.4,200,194.87Z" />
                      </svg>
                    </template>
                    {{ stopDraft.max_tokens ? `${Number(stopDraft.max_tokens).toLocaleString('en-US')} tokens` : 'Max tokens' }}
                  </UiPill>
                  <UiPill
                    :model-value="stopDraft.timeout_seconds"
                    clickable
                    dropdown-align="right"
                    :options="timeoutOptions"
                    dropdown-label="Timeout"
                    aria-label="Choose timeout seconds"
                    @update:model-value="selectStopCondition('timeout_seconds', $event)"
                  >
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                        <path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm88-24a8,8,0,0,0-8,8V82c-6.35-7.36-12.83-14.45-20.12-21.83a96,96,0,1,0-2,137.7,8,8,0,0,0-11-11.64A80,80,0,1,1,184.54,71.4C192.68,79.64,199.81,87.58,207,96H184a8,8,0,0,0,0,16h40a8,8,0,0,0,8-8V64A8,8,0,0,0,224,56Z" />
                      </svg>
                    </template>
                    {{ stopDraft.timeout_seconds ? `${Number(stopDraft.timeout_seconds).toLocaleString('en-US')} seconds` : 'Timeout seconds' }}
                  </UiPill>
                </div>
                <UiPill v-else :aria-label="`Stop condition: ${item.description}`">{{ item.description }}</UiPill>
              </template>

              <template v-else-if="item.kind === 'agents'">
                <div v-if="editingField === 'agents'" class="agent-editor" data-loop-editor>
                  <p v-if="loadingAgentOptions" class="agent-editor__status" role="status">Loading agents and models…</p>
                  <div v-for="(agent, index) in agentDrafts" :key="agent.clientId" class="agent-value">
                    <UiPill
                      :model-value="agent.role"
                      clickable
                      :options="roleOptions"
                      dropdown-label="Role"
                      aria-label="Choose agent role"
                      @update:model-value="setAgentRole(index, $event)"
                    >
                      <template #icon>
                        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                          <path d="M221.87,83.16A104.1,104.1,0,1,1,195.67,49l22.67-22.68a8,8,0,0,1,11.32,11.32l-96,96a8,8,0,0,1-11.32-11.32l27.72-27.72a40,40,0,1,0,17.87,31.09,8,8,0,1,1,16-.9,56,56,0,1,1-22.38-41.65L184.3,60.39a87.88,87.88,0,1,0,23.13,29.67,8,8,0,0,1,14.44-6.9Z" />
                        </svg>
                      </template>
                      {{ agent.role ? titleCase(agent.role) : 'Role' }}
                    </UiPill>
                    <UiPill
                      v-if="agent.role"
                      :model-value="agent.persona_id"
                      clickable
                      :options="personaOptions"
                      dropdown-label="Agent"
                      aria-label="Choose agent persona"
                      @update:model-value="setAgentPersona(index, $event)"
                    >
                      <template #icon>
                        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                          <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-24,16v24H116V152ZM80,164a12,12,0,0,1,12-12h8v24H92A12,12,0,0,1,80,164Zm84,12h-8V152h8a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z" />
                        </svg>
                      </template>
                      {{ agent.persona_id ? personaOptionLabel(agent.persona_id) : 'Agent' }}
                    </UiPill>
                    <UiPill
                      v-if="agent.role && agent.persona_id"
                      :src="agent.model_id ? modelLogoPath(agent.model_id) : undefined"
                      alt=""
                      :model-value="agent.model_id"
                      clickable
                      dropdown-align="right"
                      :options="modelOptions"
                      dropdown-label="Model"
                      aria-label="Choose agent model"
                      @update:model-value="setAgentModel(index, $event)"
                    >
                      <template #icon>
                        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                          <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z" />
                        </svg>
                      </template>
                      {{ agent.model_id ? modelOptionLabel(agent.model_id) : 'Model' }}
                    </UiPill>
                    <UiButton
                      v-if="agent.id || agent.role || agent.persona_id || agent.model_id"
                      type="button"
                      variant="coral"
                      size="sm"
                      class="agent-remove"
                      :disabled="savingField === 'agents'"
                      @click="removeAgent(index)"
                    >
                      Remove
                    </UiButton>
                  </div>
                </div>
                <div v-else v-for="agent in loop.agents" :key="agent.id" class="agent-value">
                  <UiPill :aria-label="`Agent role: ${agent.role}`">{{ titleCase(agent.role) }}</UiPill>
                  <UiPill icon-style="circle">
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                        <path :d="personaIconPath(agent.persona_id)" />
                      </svg>
                    </template>
                    {{ personaLabel(agent.persona_id) }}
                  </UiPill>
                  <UiPill :src="modelLogoPath(agent.model_id)" alt="">{{ agent.model_id }}</UiPill>
                </div>
              </template>

              <template v-else-if="item.id === 'type'">
                <UiPill
                  v-if="editingField === 'type'"
                  data-loop-editor
                  :model-value="outputTypeDraft"
                  clickable
                  :options="outputTypeOptions"
                  dropdown-label="Output type"
                  aria-label="Choose output type"
                  @update:model-value="selectOutputType"
                >
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                      <path d="M238.76,51.73A8,8,0,0,0,232,48H40a8,8,0,0,0-5.66,13.66L76.69,104,34.34,146.34A8,8,0,0,0,40,160H173.62l-28.84,60.56a8,8,0,1,0,14.44,6.88l80-168A8,8,0,0,0,238.76,51.73ZM181.23,144H59.31l34.35-34.34a8,8,0,0,0,0-11.32L59.31,64h160Z" />
                    </svg>
                  </template>
                  {{ outputTypeDraft }}
                </UiPill>
                <UiPill v-else :aria-label="`Output type: ${item.description}`">{{ item.description }}</UiPill>
              </template>

              <template v-else-if="item.id === 'files'">
                <UiPill
                  v-if="editingField === 'files'"
                  data-loop-editor
                  :model-value="outputFilesDraft"
                  clickable
                  dropdown-align="right"
                  :options="outputFileOptions"
                  dropdown-label="Output file"
                  aria-label="Choose output file"
                  @update:model-value="selectOutputFile"
                >
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                      <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
                    </svg>
                  </template>
                  {{ outputFilesDraft }}
                </UiPill>
                <template v-else>
                  <UiPill v-for="file in item.values" :key="file">{{ file }}</UiPill>
                </template>
              </template>

              <template v-else-if="item.kind === 'schema'">
                <textarea
                  v-if="editingField === 'schema'"
                  v-model="schemaDraft"
                  data-loop-editor
                  class="output-editor output-editor--schema"
                  aria-label="Output schema"
                  spellcheck="false"
                  @input="scheduleSchemaSave"
                />
                <div v-else class="output-details output-details--schema">
                  <pre><code>{{ textValue(item.detail) }}</code></pre>
                </div>
              </template>

              <template v-else-if="item.kind === 'prompt'">
                <textarea
                  v-if="editingField === 'prompt'"
                  v-model="promptDraft"
                  data-loop-editor
                  class="output-editor output-editor--prompt"
                  aria-label="Prompt"
                  @input="schedulePromptSave"
                />
                <div
                  v-else
                  class="output-details output-details--prompt markdown-content"
                  v-html="textValue(item.detail)"
                />
              </template>

              <div v-else-if="item.kind === 'created'" class="created-value">
                <span>By</span>
                <UiPill
                  class="created-value__creator"
                  :src="creatorImage"
                  alt=""
                  :aria-label="`Created by ${creatorLabel}`"
                >
                  {{ creatorLabel }}
                </UiPill>
                <span>on</span>
                <time :datetime="loop.created_at">{{ formatDate(loop.created_at) }}</time>
              </div>

              <p v-if="editingField === item.id && editError" class="basic-editor__error" role="alert">{{ editError }}</p>
            </template>

            <template #trailing="{ item }">
              <button
                v-if="isEditableField(item.id) && editingField !== item.id"
                type="button"
                class="loop-inline-action"
                :disabled="savingField !== null"
                @click="handleAction(item.id)"
              >
                <span>Edit</span>
                <span class="loop-inline-action__arrow" aria-hidden="true">→</span>
              </button>
              <span v-else class="loop-inline-action loop-inline-action--placeholder" aria-hidden="true">
                <span>Edit</span>
                <span class="loop-inline-action__arrow">→</span>
              </span>
            </template>
          </UiGridList>
        </UiSectionStage>
      </section>
    </template>
  </UiContainer>
</template>

<style scoped>
.loop-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.created-value {
  display: flex;
  min-height: 2rem;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-2);
  color: var(--ll-color-text);
}

.created-value__creator :deep(.ui-icon-pill__media--image) {
  background: var(--ll-color-metal-025);
}

.loop-breadcrumb {
  margin-bottom: var(--ll-space-4);
}

.loop-heading {
  margin-bottom: var(--ll-space-8);
}

.loop-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
}

.loop-details {
  min-width: 0;
}

.loop-details-stage :deep(.ui-section-stage__shell) {
  width: 100%;
  margin-inline: 0;
}

.basic-editor {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-3);
}

.basic-editor__error {
  flex-basis: 100%;
  margin: 0;
  color: var(--ll-color-brand-ink);
  font-size: var(--ll-text-xs);
  line-height: 1.4;
}

.loop-inline-action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.125rem;
  color: var(--ll-color-primary-depth);
  background: transparent;
  border: 0;
  font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control);
  text-decoration: none;
  opacity: 0;
  pointer-events: none;
  cursor: pointer;
  transition:
    color var(--ll-duration-normal) var(--ll-ease-out),
    opacity var(--ll-duration-normal) var(--ll-ease-out);
}

.loop-inline-action--placeholder {
  visibility: hidden;
}

.loop-details-grid :deep(.ui-grid-list__row:hover) .loop-inline-action,
.loop-details-grid :deep(.ui-grid-list__row:focus-within) .loop-inline-action,
.loop-inline-action:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.loop-inline-action__arrow {
  transition: transform var(--ll-duration-normal) var(--ll-ease-out);
}

.loop-inline-action:hover:not(:disabled) {
  color: var(--ll-color-primary);
}

.loop-inline-action:hover:not(:disabled) .loop-inline-action__arrow {
  transform: translateX(0.18rem);
}

.loop-inline-action:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}

.loop-inline-action:disabled {
  cursor: wait;
  opacity: 0.55;
}

.agent-value {
  display: flex;
  min-width: 0;
  flex: 1 0 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-2);
}

.agent-remove {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--ll-duration-normal) var(--ll-ease-out);
}

.agent-value:hover .agent-remove,
.agent-value:focus-within .agent-remove,
.agent-remove:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.agent-editor,
.stop-condition-editor {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1 0 100%;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--ll-space-2);
}

.agent-editor__status {
  flex: 1 0 100%;
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
}

.output-editor {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  field-sizing: content;
  overflow: hidden;
  padding: var(--ll-space-3);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
  resize: vertical;
  outline: none;
}

.output-editor:focus {
  border-color: var(--ll-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ll-color-primary) 18%, transparent);
}

.output-editor--prompt {
  min-height: 12rem;
  font: 500 var(--ll-text-sm) / 1.65 var(--ll-font-control);
}

.output-editor--schema {
  min-height: 18rem;
  font: 500 var(--ll-text-sm) / 1.65 var(--ll-font-mono);
  white-space: pre-wrap;
}

.agent-value + .agent-value {
  margin-top: 0.25rem;
}

.output-grid-list :deep(.ui-grid-list__metadata p) {
  margin: 0;
}

.output-details {
  width: 100%;
  min-width: 0;
  flex: 1 0 100%;
  padding: 0.375rem 0 var(--ll-space-3);
  color: var(--ll-color-text);
  border-bottom: 1px solid var(--ll-color-divider);
}

.output-details--schema pre {
  overflow: visible;
  margin: 0;
  padding: 0;
  color: var(--ll-color-ink);
  background: transparent;
  border: 0;
}

.output-details--schema {
  border-bottom: 0;
}

.output-details--schema code {
  font: 500 var(--ll-text-sm) / 1.65 var(--ll-font-mono);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.markdown-content {
  font-size: var(--ll-text-sm);
  line-height: 1.65;
  text-align: left;
}

.markdown-content :deep(:is(h1, h2, h3, h4, h5, h6)) {
  margin: var(--ll-space-8) 0 var(--ll-space-3);
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.markdown-content :deep(:is(h1, h2):first-child) {
  margin-top: 0;
}

.markdown-content :deep(h1) {
  font-size: 1.75rem;
}

.markdown-content :deep(h2) {
  font-size: 1.375rem;
}

.markdown-content :deep(:is(h3, h4, h5, h6)) {
  font-size: 1.0625rem;
}

.markdown-content :deep(p) {
  margin: 0 0 var(--ll-space-4);
}

.markdown-content :deep(:is(ul, ol)) {
  margin: 0 0 var(--ll-space-5);
  padding-left: 1.5rem;
}

.markdown-content :deep(li + li) {
  margin-top: var(--ll-space-2);
}

.markdown-content :deep(:is(strong, code)) {
  color: var(--ll-color-ink);
}

.markdown-content :deep(code) {
  padding: 0.125rem 0.3rem;
  background: var(--ll-color-highlight);
  border-radius: 0.25rem;
  font: 500 0.88em / 1.4 var(--ll-font-mono);
}

.markdown-content :deep(pre) {
  overflow-x: auto;
  margin: 0 0 var(--ll-space-5);
  padding: var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: 0.625rem;
}

.markdown-content :deep(pre code) {
  padding: 0;
  background: transparent;
}

.output-details--prompt :deep(code) {
  padding-inline: 0;
  background: transparent;
}

.output-details--prompt :deep(pre) {
  padding: 0;
  background: transparent;
  border: 0;
}

.output-details--prompt {
  border-bottom: 0;
  overflow: visible;
}

.markdown-content :deep(a) {
  color: var(--ll-color-primary);
  text-underline-offset: 0.15em;
}

.markdown-content :deep(blockquote) {
  margin: 0 0 var(--ll-space-5);
  padding-left: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  border-left: 3px solid var(--ll-color-primary);
}

.markdown-content :deep(hr) {
  margin: var(--ll-space-8) 0;
  border: 0;
  border-top: 1px solid var(--ll-color-divider);
}

.loop-state {
  display: flex;
  min-height: 14rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ll-radius-structural);
  font-size: var(--ll-text-sm);
}

.loop-state--error {
  color: var(--ll-color-brand-ink);
}

@media (max-width: 48rem) {
  .loop-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 38rem) {
  .loop-page {
    padding-block-start: var(--ll-space-8);
  }
}
</style>
