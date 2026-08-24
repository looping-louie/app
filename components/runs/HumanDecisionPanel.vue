<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { ActivityResponse, ActivityRunHumanDecision, ActivityRunResponse } from '~/types/api'

const props = defineProps<{
  activity?: ActivityResponse | null
  activityRun: ActivityRunResponse | null
  loading?: boolean
}>()

const emit = defineEmits<{
  decide: [decision: ActivityRunHumanDecision, comment: string | null]
  continue: []
}>()

const comment = ref('')
const isQuiz = computed(() => props.activity?.type === 'quiz')
const canDecide = computed(() => (
  props.activityRun?.next_action === 'submit_human_decision'
  && Boolean(props.activityRun.continuation_token)
))
const decisionRecorded = computed(() => (
  props.activityRun != null
  && ['completed', 'failed', 'stopped'].includes(props.activityRun.status)
))

watch(() => props.activityRun?.id, () => {
  comment.value = ''
})

function submit(decision: ActivityRunHumanDecision) {
  const normalizedComment = comment.value.trim()
  emit('decide', decision, normalizedComment || null)
}
</script>

<template>
  <section class="human-decision-panel" aria-labelledby="human-decision-title">
    <header class="human-decision-panel__header">
      <div>
        <span class="human-decision-panel__eyebrow">Human gate</span>
        <h2 id="human-decision-title">{{ activity?.name || (isQuiz ? 'Quiz checkpoint' : 'Approval required') }}</h2>
      </div>
      <UiPill :focusable="false">Waiting</UiPill>
    </header>

    <p v-if="activity?.description" class="human-decision-panel__description">{{ activity.description }}</p>
    <p class="human-decision-panel__contract-note">
      <template v-if="isQuiz">Record one pass or fail decision. Answers and automatic scoring are not supported by the current API.</template>
      <template v-else>Record one approval decision. Reviewer assignment and quorum are not supported by the current API.</template>
    </p>

    <template v-if="canDecide">
      <UiTextField
        v-model="comment"
        label="Comment"
        multiline
        :rows="3"
        maxlength="4000"
        placeholder="Add context for this decision (optional)…"
        :disabled="loading"
      />
      <div class="human-decision-panel__actions">
        <UiButton variant="stroke" :disabled="loading" @click="submit('cancelled')">Cancel gate</UiButton>
        <UiButton variant="coral" :disabled="loading" @click="submit('rejected')">{{ isQuiz ? 'Mark as failed' : 'Reject' }}</UiButton>
        <UiButton :loading="loading" @click="submit('approved')">{{ isQuiz ? 'Mark as passed' : 'Approve' }}</UiButton>
      </div>
    </template>

    <div v-else-if="decisionRecorded" class="human-decision-panel__recovery">
      <p>The human decision has been recorded. Continue the pipeline to finish resuming this run.</p>
      <UiButton :loading="loading" @click="emit('continue')">Continue pipeline</UiButton>
    </div>

    <p v-else class="human-decision-panel__unavailable" role="alert">
      This run is waiting, but its current activity does not expose a valid human-decision checkpoint.
    </p>
  </section>
</template>

<style scoped>
.human-decision-panel { display: grid; gap: var(--ll-space-4); padding: var(--ll-space-6); background: var(--ll-color-card); border: 1px solid var(--ll-color-divider); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); }
.human-decision-panel__header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ll-space-4); }
.human-decision-panel__eyebrow { display: block; margin-bottom: var(--ll-space-2); color: var(--ll-color-text-faint); font: 550 0.6875rem / 1.2 var(--ll-font-mono); text-transform: uppercase; letter-spacing: 0.06em; }
.human-decision-panel h2, .human-decision-panel p { margin: 0; }
.human-decision-panel h2 { color: var(--ll-color-ink); font-size: 1.25rem; line-height: 1.2; }
.human-decision-panel__description, .human-decision-panel__contract-note, .human-decision-panel__recovery p { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); line-height: 1.5; }
.human-decision-panel__contract-note { padding: var(--ll-space-3) var(--ll-space-4); background: var(--ll-color-metal-025); border-radius: var(--ll-radius-structural); }
.human-decision-panel__actions, .human-decision-panel__recovery { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--ll-space-3); }
.human-decision-panel__recovery { justify-content: space-between; }
.human-decision-panel__recovery p { flex: 1 1 24rem; }
.human-decision-panel__unavailable { color: var(--ll-color-brand-ink); }
</style>
