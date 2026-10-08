<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
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
  () => api.workers.listForProject(projectId.value),
)
const {
  data: ownedWorkers,
  status: ownedWorkersStatus,
  error: ownedWorkersError,
} = await useAsyncData('owned-workers-for-project-enablement', () => api.workers.list())
const enablementModalOpen = ref(false)
const selectedWorkerId = ref('')
const enablingWorker = ref(false)
const enablementError = ref('')
const workerRows = computed(() => (workers.value ?? []).map(toWorkerRow))
const eligibleWorkers = computed(() => {
  const enabledWorkerIds = new Set((workers.value ?? []).map(worker => worker.id))
  return (ownedWorkers.value ?? []).filter(worker => !enabledWorkerIds.has(worker.id))
})
const workerColumns = [
  { key: 'id', label: 'Worker ID', width: '30%' },
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

function openEnablementModal() {
  selectedWorkerId.value = eligibleWorkers.value[0]?.id ?? ''
  enablementError.value = ''
  enablementModalOpen.value = true
}

function updateEnablementModalOpen(open: boolean) {
  if (!enablingWorker.value) enablementModalOpen.value = open
}

async function enableSelectedWorker() {
  if (!selectedWorkerId.value || enablingWorker.value) return

  enablingWorker.value = true
  enablementError.value = ''
  try {
    await api.projects.enableWorker(projectId.value, selectedWorkerId.value)
    enablementModalOpen.value = false
    await refreshWorkers()
  } catch (exception) {
    enablementError.value = exception instanceof Error
      ? exception.message
      : 'The Worker could not be enabled for this Project.'
  } finally {
    enablingWorker.value = false
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

      <section v-if="project" class="project-workers" aria-labelledby="project-workers-title">
        <div class="project-workers__heading">
          <div>
            <h2 id="project-workers-title">Enabled Workers</h2>
            <p>Workers authorized to claim work for this Project.</p>
          </div>
          <div class="project-workers__actions">
            <UiButton size="sm" @click="openEnablementModal">Enable Worker</UiButton>
            <UiButton
              variant="stroke"
              size="sm"
              :loading="workersStatus === 'pending'"
              @click="() => refreshWorkers()"
            >Refresh</UiButton>
          </div>
        </div>

        <div v-if="workersStatus === 'pending'" class="project-workers__state" role="status">
          Loading enabled Workers…
        </div>
        <div v-else-if="workersError" class="project-workers__state project-workers__state--error" role="alert">
          <span>Enabled Workers could not be loaded.</span>
          <UiButton variant="stroke" size="sm" @click="() => refreshWorkers()">Retry</UiButton>
        </div>
        <div v-else-if="!workerRows.length" class="project-workers__state">
          No Workers are enabled for this Project.
        </div>
        <UiTable
          v-else
          :columns="workerColumns"
          :rows="workerRows"
          caption="Workers enabled for this Project"
        >
          <template #cell-id="{ value }"><code class="worker-id">{{ value }}</code></template>
          <template #cell-state="{ row }">
            <UiPill :focusable="false">{{ row.state }}</UiPill>
          </template>
        </UiTable>
      </section>
    </UiAsyncStage>

    <UiModal
      :open="enablementModalOpen"
      title="Enable Worker"
      description="Authorize a Worker you own to claim work for this Project."
      :close-on-backdrop="!enablingWorker"
      :show-close="!enablingWorker"
      @update:open="updateEnablementModalOpen"
    >
      <form class="worker-enablement-form" @submit.prevent="enableSelectedWorker">
        <p v-if="ownedWorkersStatus === 'pending'" role="status">Loading available Workers…</p>
        <p v-else-if="ownedWorkersError" class="worker-enablement-form__error" role="alert">
          Available Workers could not be loaded.
        </p>
        <p v-else-if="!eligibleWorkers.length">All owned Workers are already enabled for this Project.</p>
        <label v-else class="worker-enablement-form__field">
          <span>Worker</span>
          <select v-model="selectedWorkerId" data-autofocus required>
            <option v-for="ownedWorker in eligibleWorkers" :key="ownedWorker.id" :value="ownedWorker.id">
              {{ ownedWorker.id }} · {{ ownedWorker.harnesses.map(harness => harness.kind).join(', ') || 'No Harnesses' }}
            </option>
          </select>
        </label>
        <p v-if="enablementError" class="worker-enablement-form__error" role="alert">{{ enablementError }}</p>
      </form>

      <template #actions>
        <UiButton variant="secondary" :disabled="enablingWorker" @click="updateEnablementModalOpen(false)">Cancel</UiButton>
        <UiButton
          :disabled="!selectedWorkerId || Boolean(ownedWorkersError)"
          :loading="enablingWorker"
          @click="enableSelectedWorker"
        >Enable Worker</UiButton>
      </template>
    </UiModal>
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
.worker-id {
  color: var(--ll-color-ink);
  font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono);
  overflow-wrap: anywhere;
}

.project-workers {
  display: grid;
  gap: var(--ll-space-5);
  padding: var(--ll-space-6);
  border-top: 1px solid var(--ll-color-divider);
}

.project-workers__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-4);
}

.project-workers__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-2);
}

.project-workers h2,
.project-workers p {
  margin: 0;
}

.project-workers h2 {
  color: var(--ll-color-ink);
  font-size: 1.125rem;
  font-weight: 650;
  line-height: 1.2;
}

.project-workers p,
.project-workers__state {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

.project-workers p {
  margin-top: var(--ll-space-1);
}

.project-workers__state {
  display: flex;
  min-height: 7rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-4);
  background: var(--ll-color-metal-025);
  text-align: center;
}

.project-workers__state--error {
  color: var(--ll-color-brand-ink);
}

.worker-enablement-form {
  display: grid;
  gap: var(--ll-space-4);
}

.worker-enablement-form p {
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

.worker-enablement-form__field {
  display: grid;
  gap: var(--ll-space-2);
  color: var(--ll-color-ink);
  font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control);
}

.worker-enablement-form select {
  width: 100%;
  min-width: 0;
  height: 3rem;
  padding: 0 var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
  font: 450 1rem / 1.5 var(--ll-font-control);
}

.worker-enablement-form select:focus {
  border-color: var(--ll-color-primary);
  box-shadow: 0 0 0 3px var(--ll-color-primary-highlight);
  outline: none;
}

.worker-enablement-form__error {
  color: var(--ll-color-brand) !important;
}

@media (max-width: 36rem) {
  .project-workers__heading {
    align-items: stretch;
    flex-direction: column;
  }

  .project-workers__actions {
    justify-content: stretch;
  }
}
</style>
