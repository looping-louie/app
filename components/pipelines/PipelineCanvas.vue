<script lang="ts">
export type PipelineCanvasHumanGateKind = 'human-review' | 'four-eye-review' | 'multiple-choice-quiz'

export interface PipelineCanvasLoopAgent {
  persona_id: string
  model_id: string
  role: string
}

export interface PipelineCanvasLoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

export interface PipelineCanvasLoop {
  id: string
  title: string
  flow: string | null
  agents: PipelineCanvasLoopAgent[]
  stop_conditions: PipelineCanvasLoopStopConditions | null
}

export interface PipelineCanvasLoopActivity {
  instanceId: string
  type: 'loop'
  loop: PipelineCanvasLoop
}

export interface PipelineCanvasHumanGateActivity {
  instanceId: string
  type: 'human-gate'
  gate: PipelineCanvasHumanGateKind
  title: string
  teamMembers?: Array<'any-person' | null>
  passingScore?: number | null
}

export type PipelineCanvasActivity = PipelineCanvasLoopActivity | PipelineCanvasHumanGateActivity
</script>

<script setup lang="ts">
import PipelineConnector from '~/components/pipelines/PipelineConnector.vue'
import PipelineHumanGateCard from '~/components/pipelines/PipelineHumanGateCard.vue'
import PipelineLoopCard from '~/components/pipelines/PipelineLoopCard.vue'
import PipelineOutcomeRoute from '~/components/pipelines/PipelineOutcomeRoute.vue'
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'

const props = withDefaults(defineProps<{
  activities: PipelineCanvasActivity[]
  readonly?: boolean
  inputLabel?: string
  ariaLabel?: string
  emptyLabel?: string
}>(), {
  readonly: false,
  inputLabel: 'Input prompt',
  ariaLabel: 'Activities in this pipeline',
  emptyLabel: 'Add a loop to your new pipeline',
})

const emit = defineEmits<{
  'add-loop': []
  'add-human-gate': []
  'add-hook': []
  'edit-loop': [instanceId: string]
  'remove': [instanceId: string]
  'move': [sourceId: string, targetId: string]
  'choose-member': [instanceId: string, slotIndex: number]
  'update-passing-score': [instanceId: string, value: number | null]
}>()

const canvasRoot = ref<HTMLElement | null>(null)
const addMenuOpen = ref(false)
const draggingActivityId = ref<string | null>(null)
const dropTargetActivityId = ref<string | null>(null)
const highlightedOutcome = ref<'success' | 'failure' | null>(null)
const actionMenuId = useId()
let touchHoldTimer: ReturnType<typeof setTimeout> | undefined
let touchPointerId: number | null = null

function previousLoopDepth(index: number) {
  for (let candidate = index - 1; candidate >= 0; candidate -= 1) {
    if (props.activities[candidate]?.type === 'loop') return index - candidate
  }
  return 0
}

function failureModeFor(activity: PipelineCanvasActivity, index: number) {
  if (activity.type === 'loop') return 'stop' as const
  if (activity.gate === 'multiple-choice-quiz') return 'retry' as const
  return previousLoopDepth(index) ? 'previous' as const : 'stop' as const
}

function closeMenuAndEmit(event: 'add-loop' | 'add-human-gate' | 'add-hook') {
  addMenuOpen.value = false
  if (event === 'add-loop') emit('add-loop')
  else if (event === 'add-human-gate') emit('add-human-gate')
  else emit('add-hook')
}

function removeActivity(instanceId: string) {
  addMenuOpen.value = false
  emit('remove', instanceId)
}

function chooseMember(instanceId: string, slotIndex: number) {
  emit('choose-member', instanceId, slotIndex)
}

function updatePassingScore(instanceId: string, value: number | null) {
  emit('update-passing-score', instanceId, value)
}

function resetDragState() {
  if (touchHoldTimer) clearTimeout(touchHoldTimer)
  touchHoldTimer = undefined
  touchPointerId = null
  draggingActivityId.value = null
  dropTargetActivityId.value = null
}

function onDragStart(event: DragEvent, instanceId: string) {
  if (props.readonly) return
  draggingActivityId.value = instanceId
  event.dataTransfer?.setData('text/plain', instanceId)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event: DragEvent, instanceId: string) {
  if (props.readonly || !draggingActivityId.value || draggingActivityId.value === instanceId) return
  event.preventDefault()
  dropTargetActivityId.value = instanceId
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDrop(event: DragEvent, instanceId: string) {
  if (props.readonly) return
  event.preventDefault()
  const sourceId = draggingActivityId.value || event.dataTransfer?.getData('text/plain')
  if (sourceId && sourceId !== instanceId) emit('move', sourceId, instanceId)
  resetDragState()
}

function onActivityKeydown(event: KeyboardEvent, instanceId: string) {
  if (props.readonly) return
  const activity = props.activities.find(candidate => candidate.instanceId === instanceId)
  if (!event.altKey && activity?.type === 'loop' && ['Enter', ' '].includes(event.key)) {
    event.preventDefault()
    emit('edit-loop', instanceId)
    return
  }
  if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const index = props.activities.findIndex(activity => activity.instanceId === instanceId)
  const target = event.key === 'ArrowUp' ? index - 1 : index + 1
  const targetActivity = props.activities[target]
  if (!targetActivity) return
  emit('move', instanceId, targetActivity.instanceId)
  nextTick(() => canvasRoot.value?.querySelector<HTMLElement>(`[data-activity-id="${instanceId}"]`)?.focus())
}

function editActivity(event: MouseEvent, activity: PipelineCanvasActivity) {
  if (
    props.readonly
    || activity.type !== 'loop'
    || draggingActivityId.value
    || (event.target as HTMLElement).closest('button, a, input, textarea, select, [role="button"]')
  ) return
  emit('edit-loop', activity.instanceId)
}

function onActivityPointerDown(event: PointerEvent, instanceId: string) {
  if (
    props.readonly
    || event.pointerType !== 'touch'
    || (event.target as HTMLElement).closest('button, a, input, textarea, select, [role="button"]')
  ) return

  touchPointerId = event.pointerId
  touchHoldTimer = setTimeout(() => {
    draggingActivityId.value = instanceId
    navigator.vibrate?.(20)
  }, 320)
}

function onActivityPointerMove(event: PointerEvent) {
  if (props.readonly || touchPointerId !== event.pointerId || !draggingActivityId.value) return
  event.preventDefault()
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-activity-id]')
  const targetId = target?.dataset.activityId
  dropTargetActivityId.value = targetId && targetId !== draggingActivityId.value ? targetId : null
}

function onActivityPointerEnd(event: PointerEvent) {
  if (props.readonly || touchPointerId !== event.pointerId) return
  if (draggingActivityId.value && dropTargetActivityId.value) {
    emit('move', draggingActivityId.value, dropTargetActivityId.value)
  }
  resetDragState()
}

onBeforeUnmount(resetDragState)
</script>

<template>
  <div
    ref="canvasRoot"
    class="pipeline-canvas"
    :class="{ 'pipeline-canvas--readonly': readonly }"
  >
    <div class="pipeline-canvas__input-node">
      <UiPill class="pipeline-canvas__input-pill" :focusable="false">{{ inputLabel }}</UiPill>
      <PipelineConnector />
    </div>

    <div v-if="activities.length === 0" class="pipeline-canvas__empty">
      <slot name="empty">
        <UiPill v-if="!readonly" class="pipeline-canvas__empty-pill" :focusable="false">
          <UiButton @click="closeMenuAndEmit('add-loop')">{{ emptyLabel }}</UiButton>
        </UiPill>
        <p v-else class="pipeline-canvas__empty-copy">No pipeline activities.</p>
      </slot>
    </div>

    <div v-else class="pipeline-canvas__content">
      <ol class="pipeline-canvas__activities" :aria-label="ariaLabel">
        <li
          v-for="(activity, index) in activities"
          :key="activity.instanceId"
          class="pipeline-canvas__step"
          :class="{
            'is-dragging': draggingActivityId === activity.instanceId,
            'is-drop-target': dropTargetActivityId === activity.instanceId,
          }"
          :data-activity-id="activity.instanceId"
          :draggable="readonly ? undefined : true"
          :tabindex="readonly ? undefined : 0"
          :aria-label="readonly ? undefined : `Pipeline activity ${index + 1} of ${activities.length}. Hold and drag to exchange its position, or use Alt plus an arrow key.`"
          @dragstart="onDragStart($event, activity.instanceId)"
          @dragover="onDragOver($event, activity.instanceId)"
          @dragleave.self="dropTargetActivityId = null"
          @drop="onDrop($event, activity.instanceId)"
          @dragend="resetDragState"
          @click="editActivity($event, activity)"
          @keydown="onActivityKeydown($event, activity.instanceId)"
          @pointerdown="onActivityPointerDown($event, activity.instanceId)"
          @pointermove="onActivityPointerMove"
          @pointerup="onActivityPointerEnd"
          @pointercancel="onActivityPointerEnd"
        >
          <PipelineLoopCard
            v-if="activity.type === 'loop'"
            :loop="activity.loop"
            :instance-id="activity.instanceId"
            :readonly="readonly"
            @remove="removeActivity"
          />
          <PipelineHumanGateCard
            v-else
            :title="activity.title"
            :instance-id="activity.instanceId"
            :gate="activity.gate"
            :team-members="activity.teamMembers"
            :passing-score="activity.passingScore"
            :readonly="readonly"
            @remove="removeActivity"
            @choose-member="chooseMember"
            @update-passing-score="updatePassingScore"
          />

          <div v-if="!readonly" class="pipeline-canvas__drop-cue" aria-hidden="true">
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

      <div v-if="!readonly" class="pipeline-canvas__insertion">
        <UiButton
          variant="secondary"
          icon-only
          :aria-label="addMenuOpen ? 'Close step menu' : 'Add a pipeline step'"
          :aria-expanded="addMenuOpen"
          :aria-controls="actionMenuId"
          @click="addMenuOpen = !addMenuOpen"
        >
          <template #leading>
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z" />
            </svg>
          </template>
        </UiButton>

        <Transition name="pipeline-canvas-actions">
          <div v-if="addMenuOpen" :id="actionMenuId" class="pipeline-canvas__action-menu">
            <PipelineConnector variant="branches" class="pipeline-canvas__branch-map" />
            <div class="pipeline-canvas__actions">
              <div class="pipeline-canvas__action-branch">
                <PipelineConnector class="pipeline-canvas__mobile-branch" />
                <UiButton @click="closeMenuAndEmit('add-loop')">
                  <template #leading>
                    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                      <path d="M253.93,154.63c-1.32-1.46-24.09-26.22-61-40.56-1.72-18.42-8.46-35.17-19.41-47.92C158.87,49,137.58,40,112,40,60.48,40,26.89,86.18,25.49,88.15a8,8,0,0,0,13,9.31C38.8,97.05,68.81,56,112,56c20.77,0,37.86,7.11,49.41,20.57,7.42,8.64,12.44,19.69,14.67,32A140.87,140.87,0,0,0,140.6,104c-26.06,0-47.93,6.81-63.26,19.69C63.78,135.09,56,151,56,167.25A47.59,47.59,0,0,0,69.87,201.3c9.66,9.62,23.06,14.7,38.73,14.7,51.81,0,81.18-42.13,84.49-84.42a161.43,161.43,0,0,1,49,33.79,8,8,0,1,0,11.86-10.74Zm-94.46,21.64C150.64,187.09,134.66,200,108.6,200,83.32,200,72,183.55,72,167.25,72,144.49,93.47,120,140.6,120a124.34,124.34,0,0,1,36.78,5.68C176.93,144.44,170.46,162.78,159.47,176.27Z" />
                    </svg>
                  </template>
                  Add loop
                </UiButton>
              </div>
              <div class="pipeline-canvas__action-branch">
                <PipelineConnector class="pipeline-canvas__mobile-branch" />
                <UiButton variant="stroke" @click="closeMenuAndEmit('add-human-gate')">
                  <template #leading>
                    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                      <path d="M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z" />
                    </svg>
                  </template>
                  Add human gate
                </UiButton>
              </div>
              <div class="pipeline-canvas__action-branch">
                <PipelineConnector class="pipeline-canvas__mobile-branch" />
                <UiButton variant="metal" @click="closeMenuAndEmit('add-hook')">
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
</template>

<style scoped>
.pipeline-canvas {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
}

.pipeline-canvas__input-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pipeline-canvas__input-pill :deep(.ui-icon-pill__trigger) {
  background: transparent;
  border-style: dashed;
}

.pipeline-canvas__empty {
  display: flex;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: var(--ll-space-4);
}

.pipeline-canvas__empty-pill,
.pipeline-canvas__empty-pill :deep(.ui-icon-pill__trigger) {
  height: auto;
}

.pipeline-canvas__empty-pill :deep(.ui-icon-pill__trigger) {
  padding: 0.125rem;
}

.pipeline-canvas__empty-pill :deep(.ui-icon-pill__label) {
  overflow: visible;
}

.pipeline-canvas__empty-copy {
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}

.pipeline-canvas__content {
  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  flex-direction: column;
  align-items: stretch;
}

.pipeline-canvas:not(.pipeline-canvas--readonly) .pipeline-canvas__content {
  padding-bottom: clamp(7rem, 12vh, 10rem);
}

.pipeline-canvas__activities {
  width: 100%;
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pipeline-canvas__step {
  position: relative;
  width: 100%;
  border-radius: var(--ll-radius-structural);
  outline: none;
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out);
}

.pipeline-canvas:not(.pipeline-canvas--readonly) .pipeline-canvas__step {
  cursor: grab;
}

.pipeline-canvas:not(.pipeline-canvas--readonly) .pipeline-canvas__step:active {
  cursor: grabbing;
}

.pipeline-canvas__step.is-dragging {
  opacity: 0.38;
}

.pipeline-canvas__step:focus-visible :deep(.pipeline-loop-card__main),
.pipeline-canvas__step:focus-visible :deep(.pipeline-human-gate-card__main) {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}

.pipeline-canvas__drop-cue {
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

.pipeline-canvas__drop-cue span {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-2);
  padding: var(--ll-space-2) var(--ll-space-3);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  font: 650 var(--ll-text-xs) / 1 var(--ll-font-control);
  box-shadow: var(--ll-shadow-raised);
}

.pipeline-canvas__drop-cue svg {
  width: 1rem;
  height: 1rem;
}

.pipeline-canvas__step.is-drop-target .pipeline-canvas__drop-cue {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.pipeline-canvas__insertion {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.pipeline-canvas__action-menu {
  display: flex;
  width: min(100%, 48rem);
  flex-direction: column;
}

.pipeline-canvas__branch-map {
  width: 100%;
}

.pipeline-canvas__actions {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ll-space-4);
}

.pipeline-canvas__action-branch {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: var(--ll-space-3);
  color: var(--ll-color-divider);
}

.pipeline-canvas__mobile-branch {
  display: none;
}

.pipeline-canvas__action-branch :deep(.ui-button) {
  max-width: 100%;
}

.pipeline-canvas-actions-enter-active,
.pipeline-canvas-actions-leave-active {
  transition:
    opacity var(--ll-duration-normal) var(--ll-ease-out),
    transform var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-canvas-actions-enter-from,
.pipeline-canvas-actions-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (max-width: 48rem) {
  .pipeline-canvas__actions {
    grid-template-columns: 1fr;
  }

  .pipeline-canvas__branch-map {
    display: none;
  }

  .pipeline-canvas__action-branch {
    grid-template-columns: 3rem minmax(0, 1fr);
    align-items: center;
    justify-items: start;
  }

  .pipeline-canvas__mobile-branch {
    display: block;
    width: 3rem;
    height: 2.25rem;
    transform: rotate(-90deg);
  }

  .pipeline-canvas__action-branch :deep(.ui-button) {
    width: 100%;
  }

  .pipeline-canvas__drop-cue {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline-canvas-actions-enter-active,
  .pipeline-canvas-actions-leave-active,
  .pipeline-canvas__step,
  .pipeline-canvas__drop-cue {
    transition: none;
  }
}
</style>
