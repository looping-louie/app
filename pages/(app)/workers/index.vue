<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiTable from '~/components/ui/Table.vue'
import type { WorkerResponse } from '~/types/api'

interface WorkerTableRow extends Record<string, unknown> {
  id: string
  registered: string
  heartbeat: string
  harnesses: string[]
}

const api = useApiClient()
const { formatDateTime } = useDateTime()
const tableColumns = [
  { key: 'id', label: 'Worker ID', width: '32%' },
  { key: 'harnesses', label: 'Harnesses', type: 'option' as const, width: '28%' },
  { key: 'registered', label: 'Registered' },
  { key: 'heartbeat', label: 'Last heartbeat' },
]

const { data: workers, status, refresh } = await useAsyncData(
  'workers',
  () => api.workers.list(),
)
const rows = computed(() => (workers.value ?? []).map(toTableRow))

function refreshWorkers() {
  return refresh()
}

function toTableRow(worker: WorkerResponse): WorkerTableRow {
  return {
    id: worker.id,
    registered: formatDateTime(worker.registered_at),
    heartbeat: formatDateTime(worker.last_heartbeat_at),
    harnesses: worker.harnesses.map(harness => harness.kind),
  }
}

definePageMeta({ layout: 'app' })
useHead({ title: 'Workers · Looping Louie' })
</script>

<template>
  <PageShell
    title="Workers"
    description="Inspect Workers you own and their most recently observed Harness state."
  >
    <template #actions>
      <UiButton variant="stroke" size="sm" :loading="status === 'pending'" @click="refreshWorkers">
        Refresh
      </UiButton>
    </template>

    <UiAsyncStage
      :status="status"
      :empty="status === 'success' && !rows.length"
      loading-label="Loading Workers…"
      error-label="Workers could not be loaded."
      empty-label="No Workers are registered for this User."
      @retry="refresh"
    >
      <UiTable :columns="tableColumns" :rows="rows" caption="Workers owned by the current User">
        <template #cell-id="{ value }">
          <NuxtLink class="worker-link" :to="`/workers/${encodeURIComponent(String(value))}`">
            {{ value }}
          </NuxtLink>
        </template>
      </UiTable>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.worker-link { color: var(--ll-color-ink); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); overflow-wrap: anywhere; }
.worker-link:hover, .worker-link:focus-visible { color: var(--ll-color-primary); }
</style>
