<script setup lang="ts">
import UiPill from '~/components/ui/Pill.vue'
import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { harnessObservationFromEvent, isSchedulerEvent } from '~/utils/harnessObservations'
import { eventLabel, eventLatency, eventTokenCount } from '~/utils/pipelineRuns'

defineProps<{
  run: PipelineRunResponse
  events: PipelineRunEventResponse[]
}>()

function eventDetail(event: PipelineRunEventResponse) {
  const observation = harnessObservationFromEvent(event)
  if (observation) {
    const tokens = eventTokenCount(event)
    const latency = eventLatency(event)
    return [observation.error ?? '', tokens ? `${tokens.toLocaleString()} tokens` : '', latency ? `${(latency / 1000).toFixed(2)}s` : '']
      .filter(Boolean).join(' · ')
  }
  if (isSchedulerEvent(event) && event.event_type === 'pipeline_step_failed') return 'Activity failed'
  return event.activity_id ? `Activity ${event.activity_id}` : ''
}
</script>

<template>
  <section class="run-timeline" aria-label="Run event timeline">
    <header class="run-timeline__heading">
      <div><h2>Execution timeline</h2><p>{{ run.id }}</p></div>
      <div class="run-timeline__pills">
        <UiPill :focusable="false">{{ eventLabel(run.status) }}</UiPill>
        <UiPill :focusable="false">Commits {{ run.commit_mode === 'allow' ? 'allowed' : 'forbidden' }}</UiPill>
      </div>
    </header>

    <div v-if="run.current_activity_run" class="run-timeline__current">
      <strong>Current activity</strong>
      <span>{{ run.current_activity_run.activity_id }}</span>
      <span>{{ eventLabel(run.current_activity_run.state) }}</span>
    </div>

    <ol class="run-timeline__steps" aria-label="Pipeline steps">
      <li v-for="step in run.steps" :key="step.activity_id">
        <span>{{ step.activity_id }}</span>
        <UiPill :focusable="false">{{ eventLabel(step.status) }}</UiPill>
      </li>
    </ol>

    <ol v-if="events.length" class="run-timeline__events">
      <li v-for="event in events" :key="event.id" class="run-timeline__event">
        <span class="run-timeline__marker" aria-hidden="true" />
        <div class="run-timeline__content">
          <div class="run-timeline__event-heading">
            <strong>{{ eventLabel(event.event_type) }}</strong>
            <time :datetime="event.created_at">{{ new Date(event.created_at).toLocaleString() }}</time>
          </div>
          <p v-if="eventDetail(event)">{{ eventDetail(event) }}</p>
        </div>
      </li>
    </ol>
    <p v-else class="run-timeline__empty">No execution events have been recorded yet.</p>
  </section>
</template>

<style scoped>
.run-timeline { display: grid; gap: var(--ll-space-5); padding: var(--ll-space-6); background: var(--ll-color-card); border: 1px solid var(--ll-color-divider); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); }
.run-timeline__heading, .run-timeline__event-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ll-space-4); }
.run-timeline__pills { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ll-space-2); }
.run-timeline h2, .run-timeline p { margin: 0; }
.run-timeline__heading p, .run-timeline__event p, .run-timeline__empty { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
.run-timeline__current { display: flex; flex-wrap: wrap; gap: var(--ll-space-3); color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
.run-timeline__current strong { color: var(--ll-color-ink); }
.run-timeline__steps { display: grid; gap: var(--ll-space-2); padding: 0; margin: 0; list-style: none; }
.run-timeline__steps li { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding: var(--ll-space-3); background: var(--ll-color-metal-025); border-radius: var(--ui-surface-radius, var(--ll-radius-structural)); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); }
.run-timeline__events { display: grid; gap: 0; padding: 0; margin: 0; list-style: none; }
.run-timeline__event { position: relative; display: grid; grid-template-columns: 1rem minmax(0, 1fr); gap: var(--ll-space-4); padding-bottom: var(--ll-space-6); }
.run-timeline__event:not(:last-child)::before { position: absolute; top: 1rem; bottom: 0; left: 0.46875rem; width: 1px; content: ''; background: var(--ll-color-divider); }
.run-timeline__marker { z-index: 1; width: 0.75rem; height: 0.75rem; margin-top: 0.2rem; background: var(--ll-color-primary); border: 2px solid var(--ll-color-card); border-radius: 50%; box-shadow: 0 0 0 1px var(--ll-color-divider); }
.run-timeline__content { display: grid; min-width: 0; gap: var(--ll-space-3); }
.run-timeline__event-heading time { color: var(--ll-color-text-faint); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); }
</style>
