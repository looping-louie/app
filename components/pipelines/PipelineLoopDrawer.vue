<script setup lang="ts">
import ExecutionHarnessSelector from '~/components/execution/HarnessSelector.vue'
import ExecutionModelTargetSelector from '~/components/execution/ModelTargetSelector.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiDrawer from '~/components/ui/Drawer.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import type { ExecutionHarness, LinkedServiceResponse, ModelTarget, PersonaSummary } from '~/types/api'
import { effectiveModelTarget, modelTargetLabel } from '~/utils/executionDefaults'

type Flow = 'direct' | 'refinement' | 'roundtable'
type Role = 'generator' | 'reviewer' | 'aggregator'

interface Assignment {
  key: string
  persona_id: string
  role: Role
  model_target?: ModelTarget | null
}

interface LoopDraft {
  id: string
  title: string
  description: string
  flow: Flow
  status: string
  agents: Array<Omit<Assignment, 'key'>>
  model_target?: ModelTarget | null
  harness?: ExecutionHarness | null
  stop_conditions: {
    max_iterations: number | null
    max_tokens: number | null
    timeout_seconds: number | null
  }
}

interface CommandPaletteItem {
  id: string
  label: string
  description?: string
  group?: string
  keywords?: string[]
  iconPath?: string
  imageSrc?: string
  imageAlt?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  open: boolean
  personas: PersonaSummary[]
  linkedServices: LinkedServiceResponse[]
  inheritedModelTarget?: ModelTarget | null
  inheritedHarness?: ExecutionHarness | null
  loading?: boolean
  loop?: LoopDraft | null
}>(), { inheritedModelTarget: null, inheritedHarness: null, loading: false, loop: null })

const emit = defineEmits<{
  'update:open': [value: boolean]
  add: [loop: LoopDraft]
  update: [loop: LoopDraft]
}>()

const { personaIcon } = usePersonaIcon()
const { modelLogo } = useModelLogo()
const name = ref('')
const flow = ref<Flow>('direct')
const assignments = ref<Assignment[]>([])
const activityModelTarget = ref<ModelTarget | null>(null)
const activityHarness = ref<ExecutionHarness | null>(null)
const maxIterations = ref('3')
const maxTokens = ref('')
const timeoutSeconds = ref('')
const paletteOpen = ref(false)
const paletteQuery = ref('')
const targetRole = ref<Role>('generator')

const flowOptions = [
  { value: 'direct', label: 'Direct' },
  { value: 'refinement', label: 'Refinement' },
  { value: 'roundtable', label: 'Roundtable' },
]

const iterationLabel = computed(() => flow.value === 'direct' ? 'Max retries' : 'Max iterations')

const roleGroups = computed(() => {
  if (flow.value === 'direct') return [
    { role: 'generator' as const, title: 'Executor agent', multiple: false },
  ]
  if (flow.value === 'refinement') return [
    { role: 'generator' as const, title: 'Executor agent', multiple: false },
    { role: 'reviewer' as const, title: 'Reviewer agent/s', multiple: true },
  ]
  return [
    { role: 'generator' as const, title: 'Participant agents', multiple: true },
    { role: 'aggregator' as const, title: 'Aggregator agent', multiple: false },
  ]
})

const personaById = computed(() => new Map(props.personas.map(persona => [persona.id, persona])))
const paletteItems = computed<CommandPaletteItem[]>(() => {
  const selectedInRole = new Set(assignments.value.filter(item => item.role === targetRole.value).map(item => item.persona_id))
  return props.personas.map((persona) => {
    return {
      id: persona.id,
      label: persona.name,
      description: persona.description,
      group: 'Agents',
      keywords: [persona.id],
      iconPath: personaIcon(persona),
      disabled: selectedInRole.has(persona.id),
    }
  })
})

const canAdd = computed(() => {
  if (!name.value.trim() || !positiveInteger(maxIterations.value)) return false
  return roleGroups.value.every((group) => {
    const count = assignments.value.filter(item => item.role === group.role).length
    return flow.value === 'roundtable' && group.role === 'generator' ? count >= 2 : count >= 1
  })
})
const executionReady = computed(() => assignments.value.every(assignment => Boolean(effectiveModelTarget(
  assignment.model_target,
  activityModelTarget.value,
  props.inheritedModelTarget,
))))

function createId(prefix: string) {
  if (import.meta.client && typeof crypto.randomUUID === 'function') return `${prefix}${crypto.randomUUID()}`
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function positiveInteger(value: string) {
  if (!value) return null
  const parsed = Number(value.replaceAll(',', ''))
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
  if (field === 'maxIterations') maxIterations.value = formatted
  else if (field === 'maxTokens') maxTokens.value = formatted
  else timeoutSeconds.value = formatted
}

function resetForm(loop: LoopDraft | null = null) {
  name.value = loop?.title ?? ''
  flow.value = loop?.flow ?? 'direct'
  assignments.value = loop?.agents.map(agent => ({ ...agent, key: createId('assignment-') })) ?? []
  activityModelTarget.value = loop?.model_target ?? null
  activityHarness.value = loop?.harness ?? null
  maxIterations.value = formatIntegerInput(loop?.stop_conditions.max_iterations ?? 3)
  maxTokens.value = formatIntegerInput(loop?.stop_conditions.max_tokens)
  timeoutSeconds.value = formatIntegerInput(loop?.stop_conditions.timeout_seconds)
  paletteOpen.value = false
  paletteQuery.value = ''
}

function closeDrawer() {
  emit('update:open', false)
}

function assignmentsFor(role: Role) {
  return assignments.value.filter(assignment => assignment.role === role)
}

function openAgentPalette(role: Role) {
  targetRole.value = role
  paletteQuery.value = ''
  paletteOpen.value = true
}

function selectPaletteItem(item: CommandPaletteItem) {
  const group = roleGroups.value.find(candidate => candidate.role === targetRole.value)
  if (!group || item.disabled) return
  if (!group.multiple) assignments.value = assignments.value.filter(candidate => candidate.role !== targetRole.value)
  assignments.value.push({
    key: createId('assignment-'),
    persona_id: item.id,
    role: targetRole.value,
  })
}

function removeAssignment(key: string) {
  assignments.value = assignments.value.filter(assignment => assignment.key !== key)
}

function updateAssignmentTarget(key: string, modelTarget: ModelTarget | null) {
  assignments.value = assignments.value.map(assignment => assignment.key === key
    ? { ...assignment, model_target: modelTarget }
    : assignment)
}

function assignmentTarget(assignment: Assignment) {
  return effectiveModelTarget(assignment.model_target, activityModelTarget.value, props.inheritedModelTarget)
}

function submitLoop() {
  if (!canAdd.value) return
  const loop: LoopDraft = {
    id: props.loop?.id ?? createId('local-loop-'),
    title: name.value.trim(),
    description: props.loop?.description ?? 'Configured inside this pipeline draft.',
    flow: flow.value,
    status: props.loop?.status ?? 'draft',
    agents: assignments.value.map(({ persona_id, role, model_target }) => ({ persona_id, role, model_target })),
    model_target: activityModelTarget.value,
    harness: activityHarness.value,
    stop_conditions: {
      max_iterations: positiveInteger(maxIterations.value),
      max_tokens: positiveInteger(maxTokens.value),
      timeout_seconds: positiveInteger(timeoutSeconds.value),
    },
  }
  if (props.loop) emit('update', loop)
  else emit('add', loop)
  closeDrawer()
}

watch(flow, () => {
  const allowedRoles = new Set(roleGroups.value.map(group => group.role))
  assignments.value = assignments.value.filter(assignment => allowedRoles.has(assignment.role))
  for (const group of roleGroups.value) {
    if (!group.multiple) {
      const matching = assignments.value.filter(assignment => assignment.role === group.role)
      if (matching.length > 1) assignments.value = assignments.value.filter(assignment => assignment.role !== group.role || assignment.key === matching[0]!.key)
    }
  }
})

watch(() => props.open, (open) => {
  if (open) resetForm(props.loop)
})
</script>

<template>
  <UiDrawer
    :open="open"
    :title="loop ? 'Edit loop' : 'Your loop'"
    :description="loop ? 'Update this loop configuration.' : 'Configure the loop to be used in your pipeline.'"
    title-variant="eyebrow"
    size="default"
    @update:open="emit('update:open', $event)"
  >
    <form class="pipeline-loop-drawer" @submit.prevent="submitLoop">
      <label class="pipeline-loop-drawer__section pipeline-loop-drawer__brief">
        <span>Loop name</span>
        <input v-model="name" data-autofocus type="text" placeholder="Untitled loop" required>
      </label>

      <section class="pipeline-loop-drawer__section pipeline-loop-drawer__flow" aria-labelledby="pipeline-loop-drawer-flow-title">
        <h3 id="pipeline-loop-drawer-flow-title" class="pipeline-loop-drawer__section-title">Flow</h3>
        <UiSegmentedControl
          v-model="flow"
          :options="flowOptions"
          aria-label="Choose a loop flow"
          variant="inline"
          accent="metal"
        />
      </section>

      <section class="pipeline-loop-drawer__section pipeline-loop-drawer__activity-execution" aria-labelledby="pipeline-loop-drawer-execution-title">
        <div class="pipeline-loop-drawer__execution-heading">
          <h3 id="pipeline-loop-drawer-execution-title" class="pipeline-loop-drawer__section-title">Activity execution</h3>
          <p>These overrides apply to every agent unless an assignment chooses its own model.</p>
        </div>
        <ExecutionModelTargetSelector
          v-model="activityModelTarget"
          :services="linkedServices"
          inherit-label="Inherit pipeline model"
          :inherit-description="inheritedModelTarget ? `Currently ${inheritedModelTarget.model_id}.` : 'No inherited model is currently configured.'"
        />
        <ExecutionHarnessSelector
          v-model="activityHarness"
          inherit-label="Inherit pipeline"
          :inherit-description="inheritedHarness ? `Currently ${inheritedHarness.kind} v1.` : 'No pipeline or workspace override is configured; the API will use Louie v1.'"
        />
      </section>

      <div class="pipeline-loop-drawer__route">
        <template v-for="(group, groupIndex) in roleGroups" :key="group.role">
          <section class="pipeline-loop-drawer__section pipeline-loop-drawer__agent-group">
            <div class="pipeline-loop-drawer__group-heading">
              <h3>{{ group.title }}</h3>
              <UiButton
                v-if="group.multiple || assignmentsFor(group.role).length === 0"
                variant="secondary"
                size="sm"
                type="button"
                :disabled="loading || !personas.length"
                @click="openAgentPalette(group.role)"
              >
                <template #leading>
                  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                    <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16ZM92,120a12,12,0,1,1,12-12A12,12,0,0,1,92,120Zm84,0a12,12,0,1,1-12-12A12,12,0,0,1,176,120Zm-12,32H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm0,40H92a12,12,0,0,1,0-24h72a12,12,0,0,1,0,24Z" />
                  </svg>
                </template>
                Add an agent
              </UiButton>
            </div>

            <p v-if="!assignmentsFor(group.role).length" class="pipeline-loop-drawer__empty-role">No agent selected yet.</p>
            <ul v-else class="pipeline-loop-drawer__agents">
              <li v-for="assignment in assignmentsFor(group.role)" :key="assignment.key">
                <div class="pipeline-loop-drawer__agent-row">
                  <UiPill icon-style="circle">
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="personaIcon(personaById.get(assignment.persona_id) ?? { id: assignment.persona_id })" /></svg>
                    </template>
                    {{ personaById.get(assignment.persona_id)?.name ?? assignment.persona_id }}
                  </UiPill>
                  <span class="pipeline-loop-drawer__execution" :title="modelTargetLabel(assignmentTarget(assignment))">
                    <UiPill
                      v-if="assignmentTarget(assignment)"
                      :src="modelLogo(assignmentTarget(assignment)!.model_id)"
                      alt=""
                      :tooltip="modelTargetLabel(assignmentTarget(assignment))"
                      :focusable="false"
                    />
                    <small>{{ assignment.model_target ? assignment.model_target.model_id : `Inherits · ${modelTargetLabel(assignmentTarget(assignment))}` }}</small>
                  </span>
                  <span class="pipeline-loop-drawer__remove-control">
                    <UiButton class="pipeline-loop-drawer__remove" variant="coral" icon-only :aria-label="`Delete ${personaById.get(assignment.persona_id)?.name ?? 'agent'}`" @click="removeAssignment(assignment.key)">
                      <template #leading><svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" /></svg></template>
                    </UiButton>
                    <span class="pipeline-loop-drawer__remove-tooltip" role="tooltip">Delete</span>
                  </span>
                </div>
                <details class="pipeline-loop-drawer__agent-target">
                  <summary>Configure agent model override</summary>
                  <ExecutionModelTargetSelector
                    :model-value="assignment.model_target ?? null"
                    :services="linkedServices"
                    inherit-label="Inherit activity model"
                    :inherit-description="activityModelTarget ? `Currently ${activityModelTarget.model_id}.` : inheritedModelTarget ? `Currently ${inheritedModelTarget.model_id} from the pipeline or workspace.` : 'No inherited model is currently configured.'"
                    @update:model-value="updateAssignmentTarget(assignment.key, $event)"
                  />
                </details>
              </li>
            </ul>
          </section>
          <i v-if="groupIndex < roleGroups.length - 1" aria-hidden="true">↓</i>
        </template>
        <p v-if="assignments.length && !executionReady" class="pipeline-loop-drawer__execution-warning">
          At least one agent still needs a model at agent, activity, pipeline, or workspace scope.
        </p>
      </div>

      <i class="pipeline-loop-drawer__connector" aria-hidden="true">↓</i>

      <section class="pipeline-loop-drawer__section pipeline-loop-drawer__stop-conditions" aria-labelledby="pipeline-loop-drawer-stop-title">
        <h3 id="pipeline-loop-drawer-stop-title" class="pipeline-loop-drawer__section-title">Stop conditions</h3>
        <label>
          <span><strong>{{ iterationLabel }}</strong><small>Required</small></span>
          <span class="pipeline-loop-drawer__condition-value"><input :value="maxIterations" type="text" inputmode="numeric" pattern="[0-9,]*" required @input="updateStopCondition('maxIterations', $event)"><small>{{ flow === 'direct' ? 'retries' : 'loops' }}</small></span>
        </label>
        <label>
          <span><strong>Tokens consumed</strong><small>Optional</small></span>
          <span class="pipeline-loop-drawer__condition-value"><input :value="maxTokens" type="text" inputmode="numeric" pattern="[0-9,]*" @input="updateStopCondition('maxTokens', $event)"><small>tokens</small></span>
        </label>
        <label>
          <span><strong>Timeout</strong><small>Optional</small></span>
          <span class="pipeline-loop-drawer__condition-value"><input :value="timeoutSeconds" type="text" inputmode="numeric" pattern="[0-9,]*" @input="updateStopCondition('timeoutSeconds', $event)"><small>seconds</small></span>
        </label>
      </section>
    </form>

    <template #footer>
      <UiButton block :disabled="!canAdd" @click="submitLoop">{{ loop ? 'Save changes' : 'Add loop' }}</UiButton>
    </template>
  </UiDrawer>

  <UiCommandPalette
    v-model:open="paletteOpen"
    v-model:query="paletteQuery"
    :items="paletteItems"
    :keyboard-shortcut="false"
    option-style="card"
    placeholder="Search agents…"
    aria-label="Choose an agent"
    empty-title="No agents found"
    empty-description="Try another name or search term."
    @select="selectPaletteItem"
  />
</template>

<style scoped>
.pipeline-loop-drawer { --pipeline-loop-card-gap: var(--ll-space-4); display: grid; gap: 0; }
.pipeline-loop-drawer__brief { display: grid; gap: var(--ll-space-3); padding: var(--ll-space-6) var(--ll-space-8); }
.pipeline-loop-drawer__brief > span,
.pipeline-loop-drawer__section-title,
.pipeline-loop-drawer__group-heading h3 { padding: 0; margin: 0; color: var(--ll-color-ink); font: 600 var(--ll-text-xs) / 1 var(--ll-font-control); text-transform: uppercase; letter-spacing: 0.06em; }
.pipeline-loop-drawer__brief input { width: 100%; min-width: 0; box-sizing: border-box; padding: 0; color: var(--ll-color-ink); background: transparent; border: 0; border-bottom: 1px solid transparent; border-radius: 0; font: 600 1.2rem / 1.2 var(--ll-font-display); }
.pipeline-loop-drawer__brief input::placeholder { color: var(--ll-color-text-muted); opacity: 0.7; }
.pipeline-loop-drawer__brief input:focus { border-bottom-color: var(--ll-color-primary); outline: none; }
.pipeline-loop-drawer__section { display: grid; min-width: 0; box-sizing: border-box; padding: var(--ll-space-6) var(--ll-space-8); margin: 0; gap: var(--ll-space-3); background: var(--ll-color-canvas); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.pipeline-loop-drawer > .pipeline-loop-drawer__brief,
.pipeline-loop-drawer > .pipeline-loop-drawer__flow,
.pipeline-loop-drawer > .pipeline-loop-drawer__activity-execution { margin-bottom: var(--pipeline-loop-card-gap); }
.pipeline-loop-drawer__flow :deep(.ui-segmented-control) { width: fit-content; }
.pipeline-loop-drawer__flow { overflow-x: auto; }

.pipeline-loop-drawer__route { display: grid; justify-items: stretch; gap: 0; }
.pipeline-loop-drawer__route > i,
.pipeline-loop-drawer__connector { display: grid; height: var(--pipeline-loop-card-gap); place-items: center; color: var(--ll-color-metal-500); font-size: var(--ll-text-xs); font-style: normal; line-height: 1; text-align: center; }
.pipeline-loop-drawer__group-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-3); }
.pipeline-loop-drawer__group-heading :deep(svg) { width: 1rem; height: 1rem; }
.pipeline-loop-drawer__empty-role { margin: 0; color: var(--ll-color-text-muted); font: 400 var(--ll-text-xs) / 1.4 var(--ll-font-control); }
.pipeline-loop-drawer__agents { display: grid; padding: 0; margin: 0; gap: var(--ll-space-2); list-style: none; }
.pipeline-loop-drawer__agents li { display: grid; min-width: 0; gap: var(--ll-space-3); }
.pipeline-loop-drawer__agent-row { display: flex; min-width: 0; align-items: center; gap: var(--ll-space-2); }
.pipeline-loop-drawer__agents :deep(.ui-icon-pill) { min-width: 0; }
.pipeline-loop-drawer__agent-target { padding-top: var(--ll-space-2); border-top: 1px solid var(--ll-color-divider); }
.pipeline-loop-drawer__agent-target summary { color: var(--ll-color-text-muted); cursor: pointer; font: 550 var(--ll-text-xs) / 1.4 var(--ll-font-control); }
.pipeline-loop-drawer__agent-target[open] summary { margin-bottom: var(--ll-space-4); color: var(--ll-color-ink); }
.pipeline-loop-drawer__execution-heading { display: grid; gap: var(--ll-space-2); }
.pipeline-loop-drawer__execution-heading p { margin: 0; color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }

.pipeline-loop-drawer__execution { display: flex; min-width: 0; flex: 1; align-items: center; gap: var(--ll-space-2); color: var(--ll-color-text-muted); }
.pipeline-loop-drawer__execution :deep(.ui-icon-pill) { display: block; flex: none; }
.pipeline-loop-drawer__execution small { overflow: hidden; font: 500 var(--ll-text-xs) / 1.3 var(--ll-font-mono); text-overflow: ellipsis; white-space: nowrap; }
.pipeline-loop-drawer__execution-warning { margin: 0; color: var(--ll-color-brand-ink); font: 550 var(--ll-text-xs) / 1.4 var(--ll-font-control); }
.pipeline-loop-drawer__remove-control { position: relative; display: block; width: 1.75rem; height: 1.75rem; flex: 0 0 1.75rem; align-self: center; }
.pipeline-loop-drawer__remove {
  --ui-button-height: 1.75rem;
  --ui-button-coral-fill: var(--ll-color-brand-bright);
  --ui-button-coral-border-start: var(--ll-color-brand-bright);
  --ui-button-coral-border-end: var(--ll-color-brand-bright);
  color: var(--ll-color-metal-025);
  opacity: 0;
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out);
}
.pipeline-loop-drawer__agents li:hover .pipeline-loop-drawer__remove,
.pipeline-loop-drawer__remove:focus-visible { opacity: 1; }
.pipeline-loop-drawer__remove-tooltip {
  position: absolute;
  z-index: 20;
  bottom: calc(100% + var(--ll-space-2));
  left: 50%;
  width: max-content;
  padding: var(--ll-space-2) var(--ll-space-3);
  pointer-events: none;
  color: var(--ll-color-metal-025);
  background: var(--ll-color-metal-950);
  border-radius: var(--ll-radius-pill);
  box-shadow: var(--ll-shadow-raised);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-control);
  opacity: 0;
  transform: translate(-50%, 0.25rem);
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out), transform var(--ll-duration-fast) var(--ll-ease-out);
}
.pipeline-loop-drawer__remove:is(:hover, :focus-visible) + .pipeline-loop-drawer__remove-tooltip { opacity: 1; transform: translate(-50%, 0); }

.pipeline-loop-drawer__stop-conditions label { display: grid; min-width: 0; grid-template-columns: minmax(0, 1fr) 10.5rem; align-items: center; gap: var(--ll-space-4); }
.pipeline-loop-drawer__stop-conditions label + label { padding-top: var(--ll-space-3); border-top: 1px solid var(--ll-color-divider); }
.pipeline-loop-drawer__stop-conditions label > span:first-child { display: grid; gap: var(--ll-space-1); }
.pipeline-loop-drawer__stop-conditions strong { color: var(--ll-color-ink); font: 600 var(--ll-text-xs) / 1.2 var(--ll-font-control); }
.pipeline-loop-drawer__stop-conditions small { color: var(--ll-color-text-muted); font: 400 var(--ll-text-xs) / 1.2 var(--ll-font-control); }
.pipeline-loop-drawer__condition-value { display: grid; min-width: 0; grid-template-columns: 7rem minmax(0, 1fr); align-items: center; gap: var(--ll-space-2); }
.pipeline-loop-drawer__condition-value input { width: 7rem; box-sizing: border-box; padding: var(--ll-space-2) var(--ll-space-3); color: var(--ll-color-ink); background: var(--ll-color-canvas); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-pill); font: 600 var(--ll-text-sm) / 1 var(--ll-font-mono); text-align: right; }
.pipeline-loop-drawer__condition-value input:focus { border-color: var(--ll-color-primary); outline: 2px solid var(--ll-color-primary); outline-offset: 1px; }

.pipeline-loop-drawer :deep(.ui-button--secondary) { flex: none; }

@media (max-width: 36rem) {
  .pipeline-loop-drawer__brief,
  .pipeline-loop-drawer__section { padding-inline: var(--ll-space-6); }
  .pipeline-loop-drawer__group-heading { align-items: flex-start; flex-direction: column; }
  .pipeline-loop-drawer__stop-conditions label { grid-template-columns: 1fr; align-items: flex-start; }
  .pipeline-loop-drawer__condition-value { width: 100%; }
  .pipeline-loop-drawer__condition-value input { margin-left: auto; }
}

@media (hover: none) {
  .pipeline-loop-drawer__remove { opacity: 1; }
}
</style>
