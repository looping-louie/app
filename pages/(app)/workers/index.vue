<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTable from '~/components/ui/Table.vue'
import type { WorkerInstanceProjectResponse } from '~/types/api'

interface WorkerTableRow extends Record<string, unknown> {
  id: string
  state: string
  heartbeat: string
  enabled: string
  capacity: string
  harnesses: string[]
}

const route = useRoute()
const router = useRouter()
const api = useApiClient()
const { formatDateTime } = useDateTime()
const { projects } = useProjectContext()
const selectedProjectId = computed(() => {
  const requested = typeof route.query.project === 'string' ? route.query.project : ''
  return projects.value.some(project => project.id === requested)
    ? requested
    : (projects.value[0]?.id ?? '')
})
const selectedProjectName = computed(() => (
  projects.value.find(project => project.id === selectedProjectId.value)?.name ?? 'Project'
))
const projectOptions = computed(() => projects.value.map(project => ({
  value: project.id,
  label: project.name,
})))
const tableColumns = [
  { key: 'id', label: 'Worker ID', width: '28%' },
  { key: 'state', label: 'State', type: 'option' as const },
  { key: 'harnesses', label: 'Harnesses', type: 'option' as const, width: '24%' },
  { key: 'capacity', label: 'Used / capacity' },
  { key: 'heartbeat', label: 'Last heartbeat' },
  { key: 'enabled', label: 'Enabled' },
]

const { data: workers, status, refresh } = await useAsyncData('project-workers', loadWorkers)
watch(selectedProjectId, () => void refresh())
const rows = computed(() => (workers.value ?? []).map(toTableRow))

async function loadWorkers() {
  if (!selectedProjectId.value) return []
  return api.workers.list(selectedProjectId.value)
}

function selectProject(value: string | string[]) {
  if (typeof value !== 'string' || value === selectedProjectId.value) return
  void router.replace({ query: { ...route.query, project: value } })
}

function refreshWorkers() {
  return refresh()
}

function toTableRow(worker: WorkerInstanceProjectResponse): WorkerTableRow {
  return {
    id: worker.id,
    state: worker.active
      ? (worker.active_claims >= worker.capacity ? 'At capacity' : 'Active')
      : 'Inactive',
    heartbeat: formatDateTime(worker.last_heartbeat_at),
    enabled: formatDateTime(worker.enabled_at),
    capacity: `${worker.active_claims} / ${worker.capacity}`,
    harnesses: worker.harnesses.map(harness => harness.kind),
  }
}

definePageMeta({ layout: 'app' })
useHead({ title: 'Workers · Looping Louie' })
</script>

<template>
  <PageShell
    title="Workers"
    description="Inspect the global Workers enabled to claim work for the selected Project."
  >
    <template #actions>
      <UiButton variant="stroke" size="sm" :loading="status === 'pending'" @click="refreshWorkers">
        Refresh
      </UiButton>
      <UiPill
        v-if="projectOptions.length"
        :model-value="selectedProjectId"
        :options="projectOptions"
        clickable
        aria-haspopup="listbox"
        dropdown-label="Projects"
        aria-label="Select Project workers"
        @update:model-value="selectProject"
      >
        {{ selectedProjectName }}
      </UiPill>
    </template>

    <UiAsyncStage
      :status="status"
      :empty="status === 'success' && !rows.length"
      loading-label="Loading Workers…"
      error-label="Workers could not be loaded."
      empty-label="No global Workers are enabled for this Project."
      @retry="refresh"
    >
      <UiTable :columns="tableColumns" :rows="rows" caption="Global Workers enabled for the selected Project">
        <template #cell-id="{ value }"><code class="worker-id">{{ value }}</code></template>
        <template #cell-state="{ row }">
          <UiPill :focusable="false">
            {{ row.state }}
          </UiPill>
        </template>
      </UiTable>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.worker-id { color: var(--ll-color-ink); font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); overflow-wrap: anywhere; }
</style>
