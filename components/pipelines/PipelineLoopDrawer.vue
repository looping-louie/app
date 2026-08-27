<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import UiDrawer from '~/components/ui/Drawer.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import type { ExecutionHarness, ModelSummary, PersonaSummary } from '~/types/api'
import { effectiveModelId, modelIdLabel } from '~/utils/executionDefaults'
import {
  executionHarnessCatalogId,
  executionHarnesses,
  executionHarnessValue,
} from '~/utils/executionHarnesses'
import type { ExecutionHarnessCatalogId } from '~/utils/executionHarnesses'

type Flow = 'direct' | 'refinement' | 'roundtable'
type Role = 'generator' | 'reviewer' | 'aggregator'

interface Assignment {
  key: string
  persona_id: string
  role: Role
  model_id?: string | null
}

interface LoopDraft {
  id: string
  title: string
  description: string
  flow: Flow
  status: string
  agents: Array<Omit<Assignment, 'key'>>
  model_id?: string | null
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
  modelId?: string
  harnessId?: ExecutionHarnessCatalogId
}

const props = withDefaults(defineProps<{
  open: boolean
  personas: PersonaSummary[]
  models: ModelSummary[]
  inheritedModelId?: string | null
  inheritedHarness?: ExecutionHarness | null
  loading?: boolean
  loop?: LoopDraft | null
}>(), { inheritedModelId: null, inheritedHarness: null, loading: false, loop: null })

const emit = defineEmits<{
  'update:open': [value: boolean]
  add: [loop: LoopDraft]
  update: [loop: LoopDraft]
}>()

const { personaIcon } = usePersonaIcon()
const { modelLogo, providerLogo } = useModelLogo()
const name = ref('')
const flow = ref<Flow>('direct')
const assignments = ref<Assignment[]>([])
const activityModelId = ref<string | null>(null)
const activityHarness = ref<ExecutionHarness | null>(null)
const maxIterations = ref('3')
const maxTokens = ref('')
const timeoutSeconds = ref('')
const paletteOpen = ref(false)
const paletteQuery = ref('')
const paletteMode = ref<'persona' | 'model' | 'harness'>('persona')
const targetRole = ref<Role>('generator')
const targetAssignmentKey = ref<string | null>(null)

const flowOptions = [
  { value: 'direct', label: 'Direct' },
  { value: 'refinement', label: 'Refinement' },
  { value: 'roundtable', label: 'Roundtable' },
]

const iterationLabel = computed(() => flow.value === 'direct' ? 'Max retries' : 'Max iterations')

const roleGroups = computed(() => {
  if (flow.value === 'direct') return [
    { role: 'generator' as const, title: 'Executor persona', multiple: false },
  ]
  if (flow.value === 'refinement') return [
    { role: 'generator' as const, title: 'Executor persona', multiple: false },
    { role: 'reviewer' as const, title: 'Reviewer personas', multiple: true },
  ]
  return [
    { role: 'generator' as const, title: 'Participant personas', multiple: true },
    { role: 'aggregator' as const, title: 'Aggregator persona', multiple: false },
  ]
})

const personaById = computed(() => new Map(props.personas.map(persona => [persona.id, persona])))
const inheritedHarnessId = computed(() => executionHarnessCatalogId(props.inheritedHarness))
const selectedHarnessId = computed(() => executionHarnessCatalogId(activityHarness.value ?? props.inheritedHarness))
const selectedHarness = computed(() => (
  executionHarnesses.find(harness => harness.id === selectedHarnessId.value) ?? executionHarnesses[0]!
))
const paletteItems = computed<CommandPaletteItem[]>(() => {
  if (paletteMode.value === 'harness') {
    return executionHarnesses.map(harness => ({
      id: harness.id,
      label: harness.name,
      description: harness.owner,
      group: 'Harnesses',
      keywords: [harness.id, harness.owner],
      imageSrc: harness.image,
      imageAlt: '',
      harnessId: harness.id,
    }))
  }

  if (paletteMode.value === 'model') {
    const currentAssignment = assignments.value.find(assignment => assignment.key === targetAssignmentKey.value)
    const preferredIds = [currentAssignment?.model_id, activityModelId.value, props.inheritedModelId]
      .filter((value): value is string => Boolean(value))
    return props.models
      .filter(model => model.available)
      .map(model => ({
        id: model.id,
        label: model.name,
        description: `${model.vendor} · ${model.family}`,
        group: 'Models',
        keywords: [model.id, model.family, model.vendor],
        imageSrc: providerLogo(model.vendor, model.family) ?? modelLogo(model.id),
        imageAlt: '',
        modelId: model.id,
      }))
      .sort((left, right) => {
        const leftRank = preferredIds.indexOf(left.id)
        const rightRank = preferredIds.indexOf(right.id)
        if (leftRank !== rightRank) {
          return (leftRank < 0 ? Number.MAX_SAFE_INTEGER : leftRank)
            - (rightRank < 0 ? Number.MAX_SAFE_INTEGER : rightRank)
        }
        return left.label.localeCompare(right.label)
      })
  }

  const selectedInRole = new Set(assignments.value.filter(item => item.role === targetRole.value).map(item => item.persona_id))
  return props.personas.map((persona) => {
    return {
      id: persona.id,
      label: persona.name,
      description: persona.description,
      group: 'Personas',
      keywords: [persona.id],
      iconPath: personaIcon(persona),
      disabled: selectedInRole.has(persona.id),
    }
  })
})

const executionReady = computed(() => (
  selectedHarnessId.value === 'codex_cli'
  || assignments.value.every(assignment => Boolean(effectiveModelId(
    assignment.model_id,
    activityModelId.value,
    props.inheritedModelId,
  )))
))
const canAdd = computed(() => {
  if (!name.value.trim() || !positiveInteger(maxIterations.value) || !executionReady.value) return false
  return roleGroups.value.every((group) => {
    const count = assignments.value.filter(item => item.role === group.role).length
    return flow.value === 'roundtable' && group.role === 'generator' ? count >= 2 : count >= 1
  })
})

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
  activityModelId.value = loop?.model_id ?? null
  activityHarness.value = loop?.harness ?? null
  maxIterations.value = formatIntegerInput(loop?.stop_conditions.max_iterations ?? 3)
  maxTokens.value = formatIntegerInput(loop?.stop_conditions.max_tokens)
  timeoutSeconds.value = formatIntegerInput(loop?.stop_conditions.timeout_seconds)
  paletteOpen.value = false
  paletteQuery.value = ''
  paletteMode.value = 'persona'
  targetAssignmentKey.value = null
}

function closeDrawer() {
  emit('update:open', false)
}

function assignmentsFor(role: Role) {
  return assignments.value.filter(assignment => assignment.role === role)
}

function openPersonaPalette(role: Role) {
  targetRole.value = role
  targetAssignmentKey.value = null
  paletteMode.value = 'persona'
  paletteQuery.value = ''
  paletteOpen.value = true
}

function openModelPalette(assignment: Assignment) {
  targetAssignmentKey.value = assignment.key
  paletteMode.value = 'model'
  paletteQuery.value = ''
  paletteOpen.value = true
}

function openHarnessPalette() {
  targetAssignmentKey.value = null
  paletteMode.value = 'harness'
  paletteQuery.value = ''
  paletteOpen.value = true
}

function selectPaletteItem(item: CommandPaletteItem) {
  if (paletteMode.value === 'harness') {
    if (!item.harnessId) return
    activityHarness.value = item.harnessId === inheritedHarnessId.value
      ? null
      : executionHarnessValue(item.harnessId)
    return
  }

  if (paletteMode.value === 'model') {
    if (!item.modelId || !targetAssignmentKey.value) return
    updateAssignmentModel(targetAssignmentKey.value, item.modelId)
    return
  }

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

function updateAssignmentModel(key: string, modelId: string | null) {
  assignments.value = assignments.value.map(assignment => assignment.key === key
    ? { ...assignment, model_id: modelId }
    : assignment)
}

function assignmentModelId(assignment: Assignment) {
  return effectiveModelId(assignment.model_id, activityModelId.value, props.inheritedModelId)
}

function submitLoop() {
  if (!canAdd.value) return
  const loop: LoopDraft = {
    id: props.loop?.id ?? createId('local-loop-'),
    title: name.value.trim(),
    description: props.loop?.description ?? 'Configured inside this pipeline draft.',
    flow: flow.value,
    status: props.loop?.status ?? 'draft',
    agents: assignments.value.map(({ persona_id, role, model_id }) => ({ persona_id, role, model_id })),
    model_id: activityModelId.value,
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
        <h3 id="pipeline-loop-drawer-execution-title" class="pipeline-loop-drawer__section-title">Execution harness</h3>
        <UiPill
          variant="catalog"
          clickable
          aria-haspopup="dialog"
          :src="selectedHarness.image"
          alt=""
          :description="selectedHarness.owner"
          :aria-label="`Change execution harness. Currently ${selectedHarness.name} by ${selectedHarness.owner}`"
          @click="openHarnessPalette"
        >
          {{ selectedHarness.name }}
        </UiPill>
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
                @click="openPersonaPalette(group.role)"
              >
                <template #leading>
                  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                    <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16ZM92,120a12,12,0,1,1,12-12A12,12,0,0,1,92,120Zm84,0a12,12,0,1,1-12-12A12,12,0,0,1,176,120Zm-12,32H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm0,40H92a12,12,0,0,1,0-24h72a12,12,0,0,1,0,24Z" />
                  </svg>
                </template>
                Add a persona
              </UiButton>
            </div>

            <p v-if="!assignmentsFor(group.role).length" class="pipeline-loop-drawer__empty-role">No persona selected yet.</p>
            <ul v-else class="pipeline-loop-drawer__agents">
              <li v-for="assignment in assignmentsFor(group.role)" :key="assignment.key">
                <div class="pipeline-loop-drawer__agent-row">
                  <UiPill icon-style="circle">
                    <template #icon>
                      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="personaIcon(personaById.get(assignment.persona_id) ?? { id: assignment.persona_id })" /></svg>
                    </template>
                    {{ personaById.get(assignment.persona_id)?.name ?? assignment.persona_id }}
                  </UiPill>
                  <button
                    type="button"
                    class="pipeline-loop-drawer__model-target"
                    :title="assignmentModelId(assignment) ? modelIdLabel(assignmentModelId(assignment)) : 'Choose model'"
                    :aria-label="`Change model for ${personaById.get(assignment.persona_id)?.name ?? 'persona'}`"
                    @click="openModelPalette(assignment)"
                  >
                    <UiPill
                      v-if="assignmentModelId(assignment)"
                      :src="modelLogo(assignmentModelId(assignment)!)"
                      alt=""
                      :tooltip="modelIdLabel(assignmentModelId(assignment))"
                      :focusable="false"
                    />
                    <UiPill v-else icon-style="circle" tooltip="Choose model" :focusable="false">
                      <template #icon><span class="pipeline-loop-drawer__model-initials">AI</span></template>
                    </UiPill>
                  </button>
                  <span class="pipeline-loop-drawer__remove-control">
                    <UiButton class="pipeline-loop-drawer__remove" variant="coral" icon-only :aria-label="`Delete ${personaById.get(assignment.persona_id)?.name ?? 'persona'}`" @click="removeAssignment(assignment.key)">
                      <template #leading><svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" /></svg></template>
                    </UiButton>
                    <span class="pipeline-loop-drawer__remove-tooltip" role="tooltip">Delete</span>
                  </span>
                </div>
              </li>
            </ul>
          </section>
          <i v-if="groupIndex < roleGroups.length - 1" aria-hidden="true">↓</i>
        </template>
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
    :placeholder="paletteMode === 'persona' ? 'Search personas…' : paletteMode === 'model' ? 'Search models…' : 'Search harnesses…'"
    :aria-label="paletteMode === 'persona' ? 'Choose a persona' : paletteMode === 'model' ? 'Choose a model' : 'Choose an execution harness'"
    :empty-title="paletteMode === 'persona' ? 'No personas found' : paletteMode === 'model' ? 'No models found' : 'No harnesses found'"
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
.pipeline-loop-drawer__agents li { display: flex; min-width: 0; align-items: center; gap: var(--ll-space-2); }
.pipeline-loop-drawer__agent-row { display: flex; min-width: 0; align-items: center; gap: var(--ll-space-2); }
.pipeline-loop-drawer__agents :deep(.ui-icon-pill) { min-width: 0; }
.pipeline-loop-drawer__activity-execution :deep(.ui-icon-pill--catalog) { width: 100%; }

.pipeline-loop-drawer__model-target { display: block; width: 2rem; height: 2rem; flex: 0 0 2rem; padding: 0; color: inherit; background: transparent; border: 0; border-radius: var(--ll-radius-pill); cursor: pointer; }
.pipeline-loop-drawer__model-target:focus-visible { outline: 2px solid var(--ll-color-primary); outline-offset: 2px; }
.pipeline-loop-drawer__model-target :deep(.ui-icon-pill) { display: block; }
.pipeline-loop-drawer__model-initials { font: 650 0.625rem / 1 var(--ll-font-mono); }
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
