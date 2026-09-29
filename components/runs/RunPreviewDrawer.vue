<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiDrawer from '~/components/ui/Drawer.vue'
import UiPill from '~/components/ui/Pill.vue'
import type { PipelineRunSnapshot } from '~/utils/pipelineRuns'
import { pipelineRunDisplayStatus, runPrompt, runTokenCount } from '~/utils/pipelineRuns'

const props = defineProps<{
  open: boolean
  snapshot: PipelineRunSnapshot | null
  projectName: string
  pipelineName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  openDetails: []
}>()

const { formatDateTime } = useDateTime()
const displayStatus = computed(() => props.snapshot ? pipelineRunDisplayStatus(props.snapshot.run) : null)
const currentActivity = computed(() => props.snapshot?.run.current_activity_run)
</script>

<template>
  <UiDrawer
    :open="open"
    title="Run preview"
    :description="snapshot ? runPrompt(snapshot.run) : undefined"
    size="default"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="snapshot" class="run-preview">
      <div class="run-preview__status">
        <UiPill :focusable="false">{{ displayStatus?.label }}</UiPill>
        <span>{{ snapshot.run.id }}</span>
      </div>

      <dl class="run-preview__facts">
        <div>
          <dt>Project</dt>
          <dd>{{ projectName }}</dd>
        </div>
        <div>
          <dt>Pipeline</dt>
          <dd>{{ pipelineName }}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{{ formatDateTime(snapshot.run.created_at) }}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{{ formatDateTime(snapshot.run.updated_at) }}</dd>
        </div>
        <div>
          <dt>Tokens</dt>
          <dd>{{ runTokenCount(snapshot.events).toLocaleString() }}</dd>
        </div>
        <div>
          <dt>Run by</dt>
          <dd>{{ snapshot.run.created_by }}</dd>
        </div>
      </dl>

      <section v-if="currentActivity" class="run-preview__activity" aria-labelledby="run-preview-activity-title">
        <span>Current activity</span>
        <h3 id="run-preview-activity-title">{{ currentActivity.activity_id }}</h3>
        <p>{{ currentActivity.status.replaceAll('_', ' ') }}</p>
      </section>

      <UiButton block @click="emit('openDetails')">Open run details</UiButton>
    </div>
  </UiDrawer>
</template>

<style scoped>
.run-preview { display: grid; gap: var(--ll-space-6); }
.run-preview__status { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ll-space-3); }
.run-preview__status > span { min-width: 0; color: var(--ll-color-text-faint); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); overflow-wrap: anywhere; }
.run-preview__facts { display: grid; margin: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ll-space-5) var(--ll-space-4); }
.run-preview__facts div { display: grid; min-width: 0; gap: var(--ll-space-1); }
.run-preview__facts dt, .run-preview__activity > span { color: var(--ll-color-text-faint); font: 550 var(--ll-text-xs) / 1.3 var(--ll-font-control); }
.run-preview__facts dd { margin: 0; color: var(--ll-color-ink); overflow-wrap: anywhere; }
.run-preview__activity { display: grid; gap: var(--ll-space-2); padding: var(--ll-space-4); background: var(--ll-color-highlight); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.run-preview__activity h3, .run-preview__activity p { margin: 0; }
.run-preview__activity h3 { font: 600 var(--ll-text-sm) / 1.35 var(--ll-font-control); overflow-wrap: anywhere; }
.run-preview__activity p { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); text-transform: capitalize; }
@media (max-width: 24rem) { .run-preview__facts { grid-template-columns: 1fr; } }
</style>
