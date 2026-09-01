<script setup lang="ts">
import UiAccordion from '~/components/ui/Accordion.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { PipelineRunReadinessResponse } from '~/types/api'
import { executionHarnesses } from '~/utils/executionHarnesses'

const props = defineProps<{
  readiness: PipelineRunReadinessResponse | null
  loading: boolean
  error: string
  workspaceName: string
}>()

defineEmits<{ retry: [] }>()

const harness = computed(() => executionHarnesses.find(candidate => (
  candidate.id === props.readiness?.required_harness?.kind
)) ?? null)
const harnessVersion = computed(() => props.readiness?.required_harness?.version ?? '')
const setupItems = computed(() => harness.value
  ? [{ id: 'worker-setup', title: `Prepare a ${harness.value.name} worker` }]
  : [])
const statusTitle = computed(() => {
  if (props.error) return 'Worker status unavailable'
  if (!props.readiness) return 'Checking runtime workers…'
  if (props.readiness.status === 'ready') return 'Compatible worker available'
  if (props.readiness.status === 'no_registered_workers') return 'No runtime worker registered'
  if (props.readiness.status === 'no_active_workers') return 'No active runtime worker'
  if (props.readiness.status === 'no_compatible_workers') return 'No compatible runtime worker'
  return 'The runtime has already claimed this run'
})
const statusDescription = computed(() => {
  if (props.error) return props.error
  if (!props.readiness) return 'Reading worker heartbeats for this execution workspace.'
  if (props.readiness.status === 'ready') return 'A matching worker is online. It will claim this run automatically; no retry is needed.'
  if (props.readiness.status === 'no_registered_workers') return 'This execution workspace has no provisioned worker yet.'
  if (props.readiness.status === 'no_active_workers') return 'Workers are registered, but none has sent a heartbeat in the last two minutes.'
  if (props.readiness.status === 'no_compatible_workers') return 'Workers are online, but none currently advertises the required Harness.'
  return 'Queued diagnostics are no longer applicable.'
})
const isReady = computed(() => props.readiness?.status === 'ready')

function formatHeartbeat(value: string | null | undefined) {
  if (!value) return 'No heartbeat received'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  }).format(date)
}
</script>

<template>
  <UiCard class="worker-readiness" variant="row" :aria-busy="loading">
    <template #eyebrow>Worker readiness</template>
    <template #title>
      <h2 :role="error ? 'alert' : 'status'">{{ statusTitle }}</h2>
    </template>
    <template #description>
      <div class="worker-readiness__body">
        <p>{{ statusDescription }}</p>
        <UiButton v-if="error" variant="secondary" size="sm" :loading="loading" @click="$emit('retry')">
          Retry status
        </UiButton>
        <template v-if="readiness?.required_harness">
          <div class="worker-readiness__identity">
            <UiPill v-if="harness" :src="harness.image" :alt="harness.name">
              {{ harness.name }} · {{ harnessVersion }}
            </UiPill>
            <UiStatusText :tone="isReady ? 'enabled' : 'disabled'">
              {{ isReady ? 'Ready' : 'Needs attention' }}
            </UiStatusText>
          </div>
          <dl class="worker-readiness__facts">
            <div>
              <dt>Execution workspace</dt>
              <dd>{{ workspaceName }} <code>{{ readiness.project_id }}</code></dd>
            </div>
            <div>
              <dt>Workers</dt>
              <dd>{{ readiness.active_worker_count }} active · {{ readiness.compatible_worker_count }} compatible · {{ readiness.registered_worker_count }} registered</dd>
            </div>
            <div>
              <dt>Latest heartbeat</dt>
              <dd>{{ formatHeartbeat(readiness.latest_heartbeat_at) }}</dd>
            </div>
          </dl>
          <p v-if="harness" class="worker-readiness__note">{{ harness.availabilityNote }}</p>
          <UiAccordion v-if="harness" class="worker-readiness__setup" :items="setupItems">
            <template #content>
              <ol>
                <li v-for="step in harness.setupSteps" :key="step">{{ step }}</li>
              </ol>
            </template>
          </UiAccordion>
        </template>
      </div>
    </template>
  </UiCard>
</template>

<style scoped>
.worker-readiness { min-height: 0; }
.worker-readiness :deep(.ui-card__content) { display: grid; grid-template-columns: minmax(0, 1fr); align-items: stretch; gap: 0; }
.worker-readiness__body { display: grid; gap: var(--ll-space-4); }
.worker-readiness__body > p { margin: 0; }
.worker-readiness__identity { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ll-space-3); }
.worker-readiness__facts { display: grid; margin: 0; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ll-space-4); }
.worker-readiness__facts div { display: grid; min-width: 0; gap: var(--ll-space-1); }
.worker-readiness__facts dt { color: var(--ll-color-text-faint); font: 550 var(--ll-text-xs) / 1.3 var(--ll-font-control); }
.worker-readiness__facts dd { margin: 0; color: var(--ll-color-ink); overflow-wrap: anywhere; }
.worker-readiness__facts code { color: var(--ll-color-text-faint); font: inherit; }
.worker-readiness__note { color: var(--ll-color-text-faint); font-size: var(--ll-text-xs); }
.worker-readiness__setup { padding: 0; }
.worker-readiness__setup :deep(.ui-accordion__trigger) { padding: var(--ll-space-3) var(--ll-space-4); font-size: var(--ll-text-sm); letter-spacing: normal; }
.worker-readiness__setup ol { display: grid; margin: 0; padding: 0 var(--ll-space-6) var(--ll-space-4) calc(var(--ll-space-6) + 1rem); gap: var(--ll-space-2); color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); line-height: 1.5; }
@media (max-width: 52rem) { .worker-readiness__facts { grid-template-columns: 1fr; } }
</style>
