<script setup lang="ts">
import UiAccordion from '~/components/ui/Accordion.vue'
import UiMarkdownContent from '~/components/ui/MarkdownContent.vue'
import UiPill from '~/components/ui/Pill.vue'
import type { PipelineRunCommitMode } from '~/types/api'
import { harnessCommitSummary, type ParsedHarnessTurnEvent } from '~/utils/harnessObservations'
import { executionHarnessItem } from '~/utils/executionHarnesses'
import { eventLabel, turnUsage } from '~/utils/pipelineRuns'

const props = defineProps<{
  turn: ParsedHarnessTurnEvent
  commitMode: PipelineRunCommitMode
}>()

const observation = computed(() => props.turn.observation)
const codexObservation = computed(() => observation.value.harness.kind === 'codex_cli' ? observation.value : null)
const usage = computed(() => turnUsage(props.turn))
const accordionItems = computed(() => [{
  id: props.turn.activityRunId,
  title: props.turn.outcome === 'completed' ? 'View Harness result' : 'Inspect Harness failure',
}])
const commit = computed(() => harnessCommitSummary(observation.value, props.commitMode))
const harnessName = computed(() => executionHarnessItem(observation.value.harness).name)
const commitPolicyLabel = computed(() => commit.value.policy === 'allow' ? 'Allow runtime commit' : 'Leave uncommitted')
const commitAuthorizationLabel = computed(() => ({
  forbidden: 'Forbidden by run policy',
  authorized: 'Authorized by API',
  not_reached: 'Not reached',
}[commit.value.authorization]))
const commitOutcomeLabel = computed(() => ({
  committed: 'Commit created',
  failed: 'Commit failed',
  not_committed: 'No commit created',
  not_attempted: 'Not attempted',
}[commit.value.outcome]))
const proposedMessage = computed(() => commit.value.proposedMessage ?? (
  commit.value.policy === 'forbid' ? 'Not requested by policy' : 'Not reported'
))
const diff = computed(() => boundedDiff(observation.value.final_diff))

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatDuration(value: number | null) {
  return value === null ? '—' : `${(value / 1000).toFixed(2)}s`
}

function boundedDiff(value: string) {
  const lineLimited = value.split('\n').slice(0, 2000).join('\n')
  const text = lineLimited.slice(0, 100_000)
  return { text, truncated: text.length < value.length }
}
</script>

<template>
  <UiAccordion
    :items="accordionItems"
    :default-open="turn.outcome === 'failed' ? turn.activityRunId : ''"
    class="harness-result__accordion"
  >
    <template #content>
      <div class="harness-result">
        <div class="harness-result__pills">
          <UiPill :focusable="false">{{ eventLabel(turn.outcome) }}</UiPill>
          <UiPill :focusable="false">{{ observation.harness.kind }} {{ observation.harness.version }}</UiPill>
          <UiPill :focusable="false">{{ commitOutcomeLabel }}</UiPill>
        </div>

        <dl class="harness-result__facts">
          <div><dt>Requested model</dt><dd>{{ observation.requested_model ?? '—' }}</dd></div>
          <div><dt>Actual model</dt><dd>{{ observation.actual_model ?? '—' }}</dd></div>
          <div v-if="codexObservation"><dt>Reasoning effort</dt><dd>{{ codexObservation.reasoning_effort ?? '—' }}</dd></div>
          <div><dt>Duration</dt><dd>{{ formatDuration(observation.duration_ms) }}</dd></div>
          <div><dt>Started</dt><dd>{{ formatDateTime(observation.started_at) }}</dd></div>
          <div><dt>Completed</dt><dd>{{ formatDateTime(observation.completed_at) }}</dd></div>
          <div><dt>Input tokens</dt><dd>{{ usage.input.toLocaleString() }}</dd></div>
          <div><dt>Output tokens</dt><dd>{{ usage.output.toLocaleString() }}</dd></div>
          <div><dt>Cached tokens</dt><dd>{{ usage.cached.toLocaleString() }}</dd></div>
          <div><dt>Total tokens</dt><dd>{{ usage.total.toLocaleString() }}</dd></div>
          <div><dt>Exit code</dt><dd>{{ observation.exit_code ?? '—' }}</dd></div>
          <div v-if="codexObservation"><dt>Session</dt><dd>{{ codexObservation.session_reference ?? '—' }}</dd></div>
          <div><dt>Activity run</dt><dd>{{ turn.activityRunId }}</dd></div>
        </dl>

        <section v-if="codexObservation?.materialized_skills.length" class="harness-result__section">
          <h4>Materialized skills</h4>
          <div class="harness-result__pills">
            <UiPill v-for="skill in codexObservation.materialized_skills" :key="`${skill.id}:${skill.version}`" :focusable="false">
              {{ skill.name }} v{{ skill.version }}
            </UiPill>
          </div>
        </section>

        <section v-if="observation.error || observation.commit_error || observation.diagnostics.length" class="harness-result__section harness-result__section--error">
          <h4>Errors and diagnostics</h4>
          <p v-if="observation.error"><strong>Error:</strong> {{ observation.error }}</p>
          <p v-if="observation.commit_error"><strong>Commit error:</strong> {{ observation.commit_error }}</p>
          <ul v-if="observation.diagnostics.length">
            <li v-for="(diagnostic, index) in observation.diagnostics" :key="`${index}:${diagnostic}`">{{ diagnostic }}</li>
          </ul>
        </section>

        <section class="harness-result__section">
          <h4>Commit policy and outcome</h4>
          <dl class="harness-result__facts">
            <div><dt>Run policy</dt><dd>{{ commitPolicyLabel }}</dd></div>
            <div><dt>API authorization</dt><dd>{{ commitAuthorizationLabel }}</dd></div>
            <div><dt>Commit outcome</dt><dd>{{ commitOutcomeLabel }}</dd></div>
            <div><dt>Proposed message</dt><dd class="harness-result__commit-message">{{ proposedMessage }}</dd></div>
            <div><dt>Source commit</dt><dd>{{ observation.source_commit_sha ?? '—' }}</dd></div>
            <div><dt>Resulting commit</dt><dd>{{ commit.resultingCommitSha ?? 'No commit created' }}</dd></div>
          </dl>
        </section>

        <section class="harness-result__section">
          <h4>Final response</h4>
          <UiMarkdownContent v-if="observation.final_response" :content="observation.final_response" />
          <p v-else class="harness-result__empty">No final response was reported.</p>
        </section>

        <section class="harness-result__section">
          <h4>Changes produced by {{ harnessName }}</h4>
          <template v-if="observation.changed_files.length || diff.text">
            <h5 v-if="observation.changed_files.length">Changed files</h5>
            <ul v-if="observation.changed_files.length" class="harness-result__files">
              <li v-for="file in observation.changed_files" :key="file"><code>{{ file }}</code></li>
            </ul>
            <h5 v-if="diff.text">Final diff</h5>
            <pre v-if="diff.text"><code>{{ diff.text }}</code></pre>
            <p v-if="diff.truncated" class="harness-result__empty">Diff preview truncated to 2,000 lines or 100,000 characters.</p>
          </template>
          <p v-else class="harness-result__empty">No repository changes were reported.</p>
        </section>
      </div>
    </template>
  </UiAccordion>
</template>

<style scoped>
.harness-result__accordion { padding: 0; border-radius: var(--ll-radius-sm); }
.harness-result { display: grid; gap: var(--ll-space-6); padding: 0 var(--ll-space-6) var(--ll-space-6); }
.harness-result__pills { display: flex; flex-wrap: wrap; gap: var(--ll-space-2); }
.harness-result__facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; padding: 1px; margin: 0; overflow: hidden; background: var(--ll-color-divider); border-radius: var(--ll-radius-sm); }
.harness-result__facts div { display: grid; min-width: 0; gap: var(--ll-space-1); padding: var(--ll-space-3); background: var(--ll-color-card); }
.harness-result__facts dt { color: var(--ll-color-text-faint); font: 550 var(--ll-text-xs) / 1.3 var(--ll-font-mono); text-transform: uppercase; }
.harness-result__facts dd { min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--ll-color-ink); font: 500 var(--ll-text-sm) / 1.45 var(--ll-font-mono); }
.harness-result__section { display: grid; min-width: 0; gap: var(--ll-space-3); }
.harness-result__section h4, .harness-result__section h5, .harness-result__section p, .harness-result__section ul { margin: 0; }
.harness-result__section h4 { color: var(--ll-color-ink); font-family: var(--ll-font-display); font-size: var(--ll-text-md); }
.harness-result__section h5 { color: var(--ll-color-text-faint); font: 550 var(--ll-text-xs) / 1.3 var(--ll-font-mono); text-transform: uppercase; }
.harness-result__section--error { padding: var(--ll-space-4); color: var(--ll-color-brand-ink); background: var(--ll-color-brand-highlight); border-radius: var(--ll-radius-sm); }
.harness-result__section ul { padding-left: var(--ll-space-5); }
.harness-result__files { display: grid; gap: var(--ll-space-2); }
.harness-result__files code { overflow-wrap: anywhere; font: 500 var(--ll-text-sm) / 1.4 var(--ll-font-mono); }
.harness-result__commit-message { white-space: pre-wrap; }
.harness-result pre { max-height: 32rem; overflow: auto; padding: var(--ll-space-4); margin: 0; color: var(--ll-color-ink); background: var(--ll-color-canvas); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-sm); }
.harness-result pre code { font: 500 var(--ll-text-xs) / 1.5 var(--ll-font-mono); white-space: pre; }
.harness-result__empty { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
@media (max-width: 44rem) { .harness-result__facts { grid-template-columns: 1fr; } }
</style>
