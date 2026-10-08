<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTable from '~/components/ui/Table.vue'
import type { WorkerInstanceProjectResponse } from '~/types/api'

const route = useRoute()
const api = useApiClient()
const { formatDateTime } = useDateTime()
const projectId = computed(() => String(route.params.id))

const { data: project, status, error, refresh } = await useAsyncData(
  () => `project-${projectId.value}`,
  () => api.projects.get(projectId.value),
)
const {
  data: workers,
  status: workersStatus,
  error: workersError,
  refresh: refreshWorkers,
} = await useAsyncData(
  () => `project-workers-${projectId.value}`,
  () => api.workers.list(projectId.value),
)
const workerRows = computed(() => (workers.value ?? []).map(toWorkerRow))
const workerColumns = [
  { key: 'id', label: 'Runtime ID', width: '30%' },
  { key: 'state', label: 'State', type: 'option' as const },
  { key: 'harnesses', label: 'Harnesses', type: 'option' as const },
  { key: 'heartbeat', label: 'Last heartbeat' },
  { key: 'enabled', label: 'Enabled' },
]

function toWorkerRow(worker: WorkerInstanceProjectResponse) {
  return {
    id: worker.id,
    state: worker.active
      ? (worker.active_claims >= worker.capacity ? 'At capacity' : 'Active')
      : 'Inactive',
    harnesses: worker.harnesses.map(harness => harness.kind),
    heartbeat: formatDateTime(worker.last_heartbeat_at),
    enabled: formatDateTime(worker.enabled_at),
  }
}

definePageMeta({ layout: 'app' })

useHead(() => ({
  title: project.value
    ? `${project.value.name} · Projects · Looping Louie`
    : 'Project · Looping Louie',
}))
</script>

<template>
  <PageShell
    :title="project?.name"
    :breadcrumbs="project ? [{ label: 'Projects', to: '/projects' }, { label: project.name }] : []"
    :show-heading="Boolean(project)"
  >
    <UiAsyncStage
      :status="status"
      :error-label="error?.message ?? 'The project could not be loaded.'"
      @retry="() => refresh()"
    >
      <dl v-if="project" class="project-details">
        <div>
          <dt>Name</dt>
          <dd>{{ project.name }}</dd>
        </div>
        <div>
          <dt>Project ID</dt>
          <dd><code>{{ project.id }}</code></dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{{ formatDateTime(project.created_at) }}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{{ formatDateTime(project.updated_at) }}</dd>
        </div>
      </dl>

      <section v-if="project" class="project-runtimes" aria-labelledby="project-runtimes-title">
        <div class="project-runtimes__heading">
          <div>
            <h2 id="project-runtimes-title">Enabled runtimes</h2>
            <p>Workers authorized to claim work for this Project.</p>
          </div>
          <UiButton
            variant="stroke"
            size="sm"
            :loading="workersStatus === 'pending'"
            @click="() => refreshWorkers()"
          >Refresh</UiButton>
        </div>

        <div v-if="workersStatus === 'pending'" class="project-runtimes__state" role="status">
          Loading enabled runtimes…
        </div>
        <div v-else-if="workersError" class="project-runtimes__state project-runtimes__state--error" role="alert">
          <span>Enabled runtimes could not be loaded.</span>
          <UiButton variant="stroke" size="sm" @click="() => refreshWorkers()">Retry</UiButton>
        </div>
        <div v-else-if="!workerRows.length" class="project-runtimes__state">
          No runtimes are enabled for this Project.
        </div>
        <UiTable
          v-else
          :columns="workerColumns"
          :rows="workerRows"
          caption="Runtimes enabled for this Project"
        >
          <template #cell-id="{ value }"><code class="runtime-id">{{ value }}</code></template>
          <template #cell-state="{ row }">
            <UiPill :focusable="false">{{ row.state }}</UiPill>
          </template>
        </UiTable>
      </section>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.project-details {
  display: grid;
  gap: var(--ll-space-4);
  padding: var(--ll-space-6);
}

.project-details div {
  display: grid;
  gap: var(--ll-space-2);
}

.project-details dt {
  color: var(--ll-color-text-faint);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.project-details dd {
  margin: 0;
  color: var(--ll-color-ink);
  font: 500 var(--ll-text-base) / 1.5 var(--ll-font-control);
}

.project-details code,
.runtime-id {
  color: var(--ll-color-ink);
  font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono);
  overflow-wrap: anywhere;
}

.project-runtimes {
  display: grid;
  gap: var(--ll-space-5);
  padding: var(--ll-space-6);
  border-top: 1px solid var(--ll-color-divider);
}

.project-runtimes__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-4);
}

.project-runtimes h2,
.project-runtimes p {
  margin: 0;
}

.project-runtimes h2 {
  color: var(--ll-color-ink);
  font-size: 1.125rem;
  font-weight: 650;
  line-height: 1.2;
}

.project-runtimes p,
.project-runtimes__state {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

.project-runtimes p {
  margin-top: var(--ll-space-1);
}

.project-runtimes__state {
  display: flex;
  min-height: 7rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-4);
  background: var(--ll-color-metal-025);
  text-align: center;
}

.project-runtimes__state--error {
  color: var(--ll-color-brand-ink);
}

@media (max-width: 36rem) {
  .project-runtimes__heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
