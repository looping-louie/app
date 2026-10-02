<script setup lang="ts">
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiDrawer from '~/components/ui/Drawer.vue'
import UiPill from '~/components/ui/Pill.vue'
import type { PipelineRunDetailData } from '~/composables/usePipelineRunDetails'
import { apiErrorMessage } from '~/utils/api/errors'
import { executionHarnesses } from '~/utils/executionHarnesses'
import {
  compactRunTimeline,
  eventLabel,
  pipelineRunDisplayStatus,
  pipelineRunPreviewMetrics,
  runPrompt,
  type PipelineRunSummary,
} from '~/utils/pipelineRuns'

const props = defineProps<{
  open: boolean
  snapshot: PipelineRunSummary | null
  projectName: string
  pipelineName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  openDetails: []
}>()

const { formatDateTime } = useDateTime()
const { load } = usePipelineRunDetails()
const detail = ref<PipelineRunDetailData | null>(null)
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const error = ref('')
let requestId = 0

const displayStatus = computed(() => props.snapshot ? pipelineRunDisplayStatus(props.snapshot.run) : null)
const previewDescription = computed(() => {
  if (!props.snapshot) return undefined
  const prompt = runPrompt(props.snapshot.run).split('\n')[0]!.trim()
  return prompt.length > 180 ? `${prompt.slice(0, 177)}…` : prompt
})
const metrics = computed(() => detail.value
  ? pipelineRunPreviewMetrics(detail.value.snapshot.run, detail.value.snapshot.events)
  : null)
const timeline = computed(() => detail.value
  ? compactRunTimeline(detail.value.snapshot.run, detail.value.snapshot.events)
  : [])
const harnessLabel = computed(() => {
  const harnesses = metrics.value?.harnesses ?? []
  if (!harnesses.length) return 'Not reported'
  return harnesses.map((harness) => {
    const item = executionHarnesses.find(candidate => candidate.id === harness.kind)
    return item?.name ?? eventLabel(harness.kind)
  }).join(', ')
})

function activityName(activityId: string, index: number) {
  return detail.value?.activitiesById.get(activityId)?.name ?? `Step ${index + 1}`
}

function formatTokens(value: number | null | undefined) {
  return value === null || value === undefined ? 'Not reported' : value.toLocaleString()
}

function formatDuration(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not available'
  const totalSeconds = Math.floor(value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

async function loadPreview() {
  const snapshot = props.snapshot
  if (!props.open || !snapshot) return
  const currentRequest = ++requestId
  status.value = 'pending'
  error.value = ''
  detail.value = null
  try {
    const result = await load(snapshot.run.pipeline_id, snapshot.run.id, snapshot.projectId)
    if (currentRequest !== requestId) return
    detail.value = result
    status.value = 'success'
  } catch (cause) {
    if (currentRequest !== requestId) return
    error.value = apiErrorMessage(cause, 'Run preview could not be loaded.')
    status.value = 'error'
  }
}

watch(
  () => [props.open, props.snapshot?.run.id, props.snapshot?.projectId],
  ([open]) => {
    if (open) void loadPreview()
    else requestId += 1
  },
  { immediate: true },
)
</script>

<template>
  <UiDrawer
    :open="open"
    title="Run preview"
    :description="previewDescription"
    title-variant="eyebrow"
    size="default"
    @update:open="emit('update:open', $event)"
  >
    <template #actions>
      <UiButton
        v-if="snapshot"
        variant="stroke"
        size="sm"
        icon-only
        aria-label="Open run details"
        title="Open run details"
        @click="emit('openDetails')"
      >
        <template #leading>
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224,104a8,8,0,0,1-16,0V59.31l-98.34,98.35a8,8,0,0,1-11.32-11.32L196.69,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-32,24a8,8,0,0,0-8,8v72H48V72h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,72V208a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V136A8,8,0,0,0,192,128Z" />
          </svg>
        </template>
      </UiButton>
    </template>

    <div v-if="snapshot" class="run-preview">
      <div class="run-preview__context">
        <UiPill :focusable="false" :tone="displayStatus?.tone">{{ displayStatus?.label }}</UiPill>
        <p>{{ projectName }} <span aria-hidden="true">/</span> {{ pipelineName }}</p>
      </div>

      <UiAsyncStage
        :status="status"
        inverse="none"
        loading-label="Loading run preview…"
        :error-label="error"
        @retry="loadPreview"
      >
        <div v-if="detail && metrics" class="run-preview__content">
          <section class="run-preview__section" aria-labelledby="run-preview-overview-title">
            <h3 id="run-preview-overview-title">Execution</h3>
            <dl class="run-preview__metrics run-preview__metrics--execution">
              <div><dt>Start</dt><dd>{{ metrics.startedAt ? formatDateTime(metrics.startedAt) : 'Not available' }}</dd></div>
              <div><dt>End</dt><dd>{{ metrics.endedAt ? formatDateTime(metrics.endedAt) : metrics.startedAt ? 'In progress' : 'Not available' }}</dd></div>
              <div><dt>Duration</dt><dd>{{ formatDuration(metrics.durationMs) }}</dd></div>
            </dl>
          </section>

          <section class="run-preview__section" aria-labelledby="run-preview-usage-title">
            <h3 id="run-preview-usage-title">Usage</h3>
            <dl class="run-preview__metrics run-preview__metrics--usage">
              <div><dt>Input</dt><dd>{{ formatTokens(metrics.inputTokens) }}</dd></div>
              <div><dt>Output</dt><dd>{{ formatTokens(metrics.outputTokens) }}</dd></div>
              <div><dt>Cache</dt><dd>{{ formatTokens(metrics.cacheTokens) }}</dd></div>
              <div class="run-preview__metric--wide"><dt>Harness</dt><dd>{{ harnessLabel }}</dd></div>
            </dl>
          </section>

          <section class="run-preview__section run-preview__timeline" aria-labelledby="run-preview-timeline-title">
            <h3 id="run-preview-timeline-title">Timeline</h3>
            <ol v-if="timeline.length">
              <li v-for="(entry, index) in timeline" :key="`${entry.activityId}-${entry.activityRunId ?? index}`">
                <span class="run-preview__marker" aria-hidden="true" />
                <div>
                  <strong>{{ activityName(entry.activityId, index) }}</strong>
                  <time v-if="entry.timestamp" :datetime="entry.timestamp">{{ formatDateTime(entry.timestamp) }}</time>
                  <span v-else>Not started</span>
                </div>
              </li>
            </ol>
            <p v-else class="run-preview__empty">No pipeline steps are available.</p>
          </section>
        </div>
      </UiAsyncStage>
    </div>
  </UiDrawer>
</template>

<style scoped>
.run-preview { display: grid; gap: var(--ll-space-4); }
.run-preview__context { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: var(--ll-space-3); }
.run-preview__context p { min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--ll-color-text-muted); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-control); text-align: right; }
.run-preview__context p span { padding-inline: var(--ll-space-1); color: var(--ll-color-text-faint); }
.run-preview :deep(.ui-section-stage__content) { padding: 0; }
.run-preview__content { display: grid; gap: var(--ll-space-4); }
.run-preview__section { display: grid; min-width: 0; gap: var(--ll-space-3); padding: var(--ll-space-5) var(--ll-space-6); background: var(--ll-color-canvas); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.run-preview__section > h3 { padding: 0; margin: 0; color: var(--ll-color-ink); font: 600 var(--ll-text-xs) / 1 var(--ll-font-control); text-transform: uppercase; letter-spacing: 0.06em; }
.run-preview__metrics { display: grid; margin: 0; }
.run-preview__metrics--execution, .run-preview__metrics--usage { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.run-preview__metrics > div { display: grid; min-width: 0; align-content: start; gap: var(--ll-space-1); padding: var(--ll-space-3); }
.run-preview__metrics > div + div { border-left: 1px solid var(--ll-color-divider); }
.run-preview__metrics dt { color: var(--ll-color-text-faint); font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-control); }
.run-preview__metrics dd { min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--ll-color-ink); font: 600 var(--ll-text-sm) / 1.4 var(--ll-font-control); font-variant-numeric: tabular-nums; }
.run-preview__metric--wide { grid-column: 1 / -1; border-top: 1px solid var(--ll-color-divider); border-left: 0 !important; }
.run-preview__timeline ol { display: grid; padding: 0; margin: 0; list-style: none; }
.run-preview__timeline li { position: relative; display: grid; min-width: 0; grid-template-columns: 0.875rem minmax(0, 1fr); gap: var(--ll-space-3); padding-bottom: var(--ll-space-5); }
.run-preview__timeline li:last-child { padding-bottom: 0; }
.run-preview__timeline li:not(:last-child)::before { position: absolute; top: 0.75rem; bottom: 0; left: 0.34375rem; width: 1px; content: ''; background: var(--ll-color-divider); }
.run-preview__marker { position: relative; z-index: 1; width: 0.625rem; height: 0.625rem; margin-top: 0.2rem; background: var(--ll-color-primary); border: 2px solid var(--ll-color-card); border-radius: 50%; box-shadow: 0 0 0 1px var(--ll-color-divider); }
.run-preview__timeline li > div { display: grid; min-width: 0; gap: var(--ll-space-1); }
.run-preview__timeline strong { overflow-wrap: anywhere; font: 600 var(--ll-text-sm) / 1.35 var(--ll-font-control); }
.run-preview__timeline time, .run-preview__timeline li > div > span, .run-preview__empty { color: var(--ll-color-text-muted); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-control); }
.run-preview__empty { margin: 0; }
@media (max-width: 30rem) {
  .run-preview__context { align-items: flex-start; flex-direction: column; }
  .run-preview__context p { text-align: left; }
  .run-preview__section { padding-inline: var(--ll-space-5); }
  .run-preview__metrics--execution, .run-preview__metrics--usage { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .run-preview__metrics > div { border-left: 0; }
  .run-preview__metrics > div:nth-child(even) { border-left: 1px solid var(--ll-color-divider); }
  .run-preview__metrics > div:nth-child(n + 3) { border-top: 1px solid var(--ll-color-divider); }
}
</style>
