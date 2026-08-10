<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'

type HumanGateKind = 'human-review' | 'four-eye-review' | 'multiple-choice-quiz'

const props = defineProps<{
  title: string
  instanceId: string
  gate: HumanGateKind
  teamMembers?: Array<'any-person' | null>
  passingScore?: number | null
}>()

const emit = defineEmits<{
  remove: [instanceId: string]
  'choose-member': [instanceId: string, slotIndex: number]
  'update-passing-score': [instanceId: string, value: number | null]
}>()

const USER_CIRCLE_PLUS_PATH = 'M168,56a8,8,0,0,1,8-8h16V32a8,8,0,0,1,16,0V48h16a8,8,0,0,1,0,16H208V80a8,8,0,0,1-16,0V64H176A8,8,0,0,1,168,56Zm62.56,54.68a103.92,103.92,0,1,1-85.24-85.24,8,8,0,0,1-2.64,15.78A88.07,88.07,0,0,0,40,128a87.62,87.62,0,0,0,22.24,58.41A79.66,79.66,0,0,1,98.3,157.66a48,48,0,1,1,59.4,0,79.66,79.66,0,0,1,36.06,28.75A87.62,87.62,0,0,0,216,128a88.85,88.85,0,0,0-1.22-14.68,8,8,0,1,1,15.78-2.64ZM128,152a32,32,0,1,0-32-32A32,32,0,0,0,128,152Zm0,64a87.57,87.57,0,0,0,53.92-18.5,64,64,0,0,0-107.84,0A87.57,87.57,0,0,0,128,216Z'
const SMILEY_PATH = 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,48c-10.29,17.79-27.4,28-46.93,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.07-20a8,8,0,0,1,13.86,8Z'

const memberSlots = computed(() => props.gate === 'four-eye-review' ? 2 : props.gate === 'human-review' ? 1 : 0)

function onPassingScoreInput(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.value) {
    emit('update-passing-score', props.instanceId, null)
    return
  }

  const value = Math.min(10, Math.max(1, Math.trunc(Number(input.value))))
  input.value = String(value)
  emit('update-passing-score', props.instanceId, value)
}
</script>

<template>
  <article class="pipeline-human-gate-card">
    <UiButton
      class="pipeline-human-gate-card__remove"
      variant="coral"
      size="sm"
      icon-only
      :aria-label="`Remove ${title}`"
      @click.stop="emit('remove', instanceId)"
    >
      <template #leading>
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
    </UiButton>

    <UiCard variant="editorial" class="pipeline-human-gate-card__main">
      <template #eyebrow>HUMAN GATE</template>
      <template #title><h3>{{ title }}</h3></template>
    </UiCard>

    <div v-if="memberSlots" class="pipeline-human-gate-card__configuration pipeline-human-gate-card__configuration--members">
      <span class="pipeline-human-gate-card__configuration-label">TEAM MEMBERS</span>
      <span class="pipeline-human-gate-card__members">
        <UiButton
          v-for="slotIndex in memberSlots"
          :key="slotIndex"
          variant="secondary"
          icon-only
          draggable="false"
          :aria-label="teamMembers?.[slotIndex - 1] === 'any-person' ? `Change team member ${slotIndex}` : `Choose team member ${slotIndex}`"
          :title="teamMembers?.[slotIndex - 1] === 'any-person' ? 'Any person' : 'Choose a person'"
          @mousedown.stop
          @click.stop="emit('choose-member', instanceId, slotIndex - 1)"
        >
          <template #leading>
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path :d="teamMembers?.[slotIndex - 1] === 'any-person' ? SMILEY_PATH : USER_CIRCLE_PLUS_PATH" />
            </svg>
          </template>
        </UiButton>
      </span>
    </div>

    <label v-else class="pipeline-human-gate-card__configuration pipeline-human-gate-card__configuration--score">
      <span class="pipeline-human-gate-card__configuration-label">PASSING SCORE</span>
      <span class="pipeline-human-gate-card__score-control">
        <input
          :value="passingScore ?? ''"
          type="number"
          min="1"
          max="10"
          step="1"
          inputmode="numeric"
          draggable="false"
          aria-label="Passing score out of 10"
          @pointerdown.stop
          @mousedown.stop
          @click.stop
          @dragstart.stop.prevent
          @input="onPassingScoreInput"
        >
        <span>/10</span>
      </span>
    </label>
  </article>
</template>

<style scoped>
.pipeline-human-gate-card {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 7.5rem;
  align-items: stretch;
  justify-content: center;
}

.pipeline-human-gate-card__main {
  width: min(100%, 26rem);
  min-height: 7.5rem;
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-human-gate-card__main :deep(.ui-card__content) {
  justify-content: center;
  padding: var(--ll-space-5) var(--ll-space-6);
}

.pipeline-human-gate-card__configuration {
  position: absolute;
  z-index: 4;
  top: 50%;
  right: calc(50% - 13rem + var(--ll-space-5));
  display: grid;
  grid-template-rows: 0.825rem 1.4375rem;
  justify-items: end;
  row-gap: var(--ll-space-3);
  transform: translateY(-50%);
}

.pipeline-human-gate-card__configuration-label {
  color: var(--ll-color-text-faint);
  font: 550 0.6875rem / 1.2 var(--ll-font-mono);
  letter-spacing: 0.06em;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out);
}

.pipeline-human-gate-card__members,
.pipeline-human-gate-card__score-control {
  display: inline-flex;
  height: 1.4375rem;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ll-space-2);
}

.pipeline-human-gate-card__configuration--members:has(.pipeline-human-gate-card__members:is(:hover, :focus-within)) .pipeline-human-gate-card__configuration-label,
.pipeline-human-gate-card__configuration--score:has(.pipeline-human-gate-card__score-control:is(:hover, :focus-within)) .pipeline-human-gate-card__configuration-label {
  opacity: 1;
}

.pipeline-human-gate-card__score-control {
  color: var(--ll-color-text-muted);
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-control);
}

.pipeline-human-gate-card__score-control input {
  width: 2.75rem;
  height: 2rem;
  box-sizing: border-box;
  padding: 0 var(--ll-space-2);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: 999px;
  outline: none;
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-control);
  text-align: center;
  transition:
    border-color var(--ll-duration-fast) var(--ll-ease-out),
    box-shadow var(--ll-duration-fast) var(--ll-ease-out);
  appearance: textfield;
}

.pipeline-human-gate-card__score-control input::-webkit-inner-spin-button,
.pipeline-human-gate-card__score-control input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.pipeline-human-gate-card__score-control input:is(:hover, :focus) {
  border-color: var(--ll-color-primary);
  box-shadow: 0 0 0 3px var(--ll-color-primary-highlight);
}

.pipeline-human-gate-card__remove {
  position: absolute;
  z-index: 3;
  top: 50%;
  right: calc(50% + 14rem);
  opacity: 0;
  pointer-events: none;
  transform: translate(0.5rem, -50%);
  transition:
    opacity var(--ll-duration-normal) var(--ll-ease-out),
    transform var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-human-gate-card:is(:hover, :focus-within) .pipeline-human-gate-card__main {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.pipeline-human-gate-card:is(:hover, :focus-within) .pipeline-human-gate-card__remove {
  opacity: 1;
  pointer-events: auto;
  transform: translate(0, -50%);
}

@media (max-width: 70rem) {
  .pipeline-human-gate-card__main { width: 100%; }
  .pipeline-human-gate-card__configuration { right: var(--ll-space-5); }
  .pipeline-human-gate-card__remove {
    top: var(--ll-space-3);
    right: var(--ll-space-3);
    transform: translateY(-0.25rem);
  }
  .pipeline-human-gate-card:is(:hover, :focus-within) .pipeline-human-gate-card__remove { transform: translateY(0); }
}

@media (hover: none) {
  .pipeline-human-gate-card__remove { opacity: 1; pointer-events: auto; }
  .pipeline-human-gate-card__configuration-label { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline-human-gate-card__main,
  .pipeline-human-gate-card__remove,
  .pipeline-human-gate-card__configuration-label { transition: none; }
}
</style>
