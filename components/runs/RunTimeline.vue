<script setup lang="ts">
import HumanGatePanel from '~/components/runs/HumanGatePanel.vue'
import UiPill from '~/components/ui/Pill.vue'
import type { GateDecisionRequest, PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { eventLabel, eventLatency, eventTokenCount } from '~/utils/pipelineRuns'

const props = defineProps<{
  run: PipelineRunResponse
  resolvedGates: Set<string>
  decidingGate?: string
}>()

const emit = defineEmits<{
  decide: [event: PipelineRunEventResponse, decision: GateDecisionRequest]
}>()

function gateResolved(event: PipelineRunEventResponse, index: number) {
  if (!event.step_id) return true
  if (props.resolvedGates.has(event.id)) return true
  return props.run.events.slice(index + 1).some(item => (
    item.step_id === event.step_id
    && ['human_gate_decided', 'step_completed', 'step_failed'].includes(item.type)
  ))
}

function eventDetail(event: PipelineRunEventResponse) {
  if (event.type === 'step_failed') return String(event.payload.message || 'Activity failed')
  if (event.type === 'human_gate_decided') {
    return [event.payload.status, event.payload.comment].filter(Boolean).map(String).join(' · ')
  }
  if (event.type === 'human_gate_correction_started') {
    return String(event.payload.feedback || 'Applying the requested correction')
  }
  if (event.type === 'human_gate_correction_completed') return 'Ready for another review'
  if (event.type === 'human_gate_reopened') return 'Review reopened'
  if (event.type === 'step_retry_started') return 'Applying human feedback'
  if (event.type === 'step_retry_completed') return 'Corrected output produced'
  if (event.type === 'step_retry_failed') return String(event.payload.message || 'Correction failed')
  if (event.type === 'agent_response_received') {
    const tokens = eventTokenCount(event)
    const latency = eventLatency(event)
    return [tokens ? `${tokens.toLocaleString()} tokens` : '', latency ? `${(latency / 1000).toFixed(2)}s` : '']
      .filter(Boolean).join(' · ')
  }
  return event.step_id ? `Activity ${event.step_id}` : ''
}
</script>

<template>
  <section class="run-timeline" aria-label="Run event timeline">
    <header class="run-timeline__heading">
      <div><h2>Execution timeline</h2><p>{{ run.id }}</p></div>
      <UiPill :focusable="false">{{ run.status }}</UiPill>
    </header>

    <ol v-if="run.events.length" class="run-timeline__events">
      <li v-for="(event, index) in run.events" :key="event.id" class="run-timeline__event">
        <span class="run-timeline__marker" aria-hidden="true" />
        <div class="run-timeline__content">
          <div class="run-timeline__event-heading">
            <strong>{{ eventLabel(event.type) }}</strong>
            <time :datetime="event.created_at">{{ new Date(event.created_at).toLocaleString() }}</time>
          </div>
          <p v-if="eventDetail(event)">{{ eventDetail(event) }}</p>
          <HumanGatePanel
            v-if="event.type === 'human_gate_waiting'"
            :event="event"
            :resolved="gateResolved(event, index)"
            :loading="decidingGate === event.step_id"
            @decide="emit('decide', event, $event)"
          />
        </div>
      </li>
    </ol>
    <p v-else class="run-timeline__empty">The worker has not reported any events yet.</p>
  </section>
</template>

<style scoped>
.run-timeline { display: grid; gap: var(--ll-space-5); padding: var(--ll-space-6); background: var(--ll-color-card); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.run-timeline__heading, .run-timeline__event-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ll-space-4); }
.run-timeline h2, .run-timeline p { margin: 0; }
.run-timeline__heading p, .run-timeline__event p, .run-timeline__empty { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
.run-timeline__events { display: grid; gap: 0; padding: 0; margin: 0; list-style: none; }
.run-timeline__event { position: relative; display: grid; grid-template-columns: 1rem minmax(0, 1fr); gap: var(--ll-space-4); padding-bottom: var(--ll-space-6); }
.run-timeline__event:not(:last-child)::before { position: absolute; top: 1rem; bottom: 0; left: 0.46875rem; width: 1px; content: ''; background: var(--ll-color-divider); }
.run-timeline__marker { z-index: 1; width: 0.75rem; height: 0.75rem; margin-top: 0.2rem; background: var(--ll-color-primary); border: 2px solid var(--ll-color-card); border-radius: 50%; box-shadow: 0 0 0 1px var(--ll-color-divider); }
.run-timeline__content { display: grid; min-width: 0; gap: var(--ll-space-3); }
.run-timeline__event-heading time { color: var(--ll-color-text-faint); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); }
</style>
