<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { GateDecisionRequest, PipelineRunEventResponse } from '~/types/api'
import { recordValue } from '~/utils/pipelineRuns'

const props = defineProps<{
  event: PipelineRunEventResponse
  resolved?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  decide: [decision: GateDecisionRequest]
}>()

const response = ref('')
const gateType = computed(() => props.event.payload.gate_type === 'quiz' ? 'quiz' : 'approval')
const instructions = computed(() => String(props.event.payload.instructions || 'Review this Activity before continuing.'))
const quiz = computed(() => recordValue(props.event.payload.quiz))
const quizSummary = computed(() => {
  if (gateType.value !== 'quiz') return ''
  const questions = quiz.value?.question_count
  const minimum = quiz.value?.minimum_correct_answers
  if (typeof questions !== 'number') return 'Complete the requested quiz before continuing.'
  return `Answer ${questions} questions. ${typeof minimum === 'number' ? `${minimum} correct answers are required.` : ''}`
})

function decide(status: GateDecisionRequest['status']) {
  emit('decide', { status, comment: response.value.trim() || null })
}
</script>

<template>
  <section class="human-gate" :aria-label="`${gateType} gate`">
    <header class="human-gate__header">
      <strong>{{ gateType === 'quiz' ? 'Quiz required' : 'Approval required' }}</strong>
      <UiPill :focusable="false">{{ resolved ? 'Resolved' : 'Waiting' }}</UiPill>
    </header>
    <p>{{ instructions }}</p>
    <p v-if="quizSummary" class="human-gate__hint">{{ quizSummary }}</p>
    <UiTextField
      v-if="!resolved"
      v-model="response"
      :label="gateType === 'quiz' ? 'Answers or notes' : 'Decision comment'"
      multiline
      :rows="3"
      :placeholder="gateType === 'quiz' ? 'Enter your answers…' : 'Optional context for this decision…'"
    />
    <div v-if="!resolved" class="human-gate__actions">
      <UiButton variant="secondary" :disabled="loading" @click="decide('rejected')">Reject</UiButton>
      <UiButton :loading="loading" @click="decide('approved')">
        {{ gateType === 'quiz' ? 'Submit and continue' : 'Approve and continue' }}
      </UiButton>
    </div>
  </section>
</template>

<style scoped>
.human-gate { display: grid; gap: var(--ll-space-4); padding: var(--ll-space-5); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); }
.human-gate__header { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-3); }
.human-gate p { margin: 0; color: var(--ll-color-text-muted); line-height: 1.55; }
.human-gate__hint { font-size: var(--ll-text-xs); }
.human-gate__actions { display: flex; justify-content: flex-end; gap: var(--ll-space-3); }
</style>
