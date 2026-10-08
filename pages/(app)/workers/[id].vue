<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiTable from '~/components/ui/Table.vue'
import type { ProjectResponse } from '~/types/api'

const route = useRoute()
const api = useApiClient()
const { formatDateTime } = useDateTime()
const workerId = computed(() => String(route.params.id))

const { data: worker, status, error, refresh } = await useAsyncData(
  () => `worker-${workerId.value}`,
  () => api.workers.get(workerId.value),
)
const {
  data: enabledProjects,
  status: enabledProjectsStatus,
  error: enabledProjectsError,
  refresh: refreshEnabledProjects,
} = await useAsyncData(
  () => `worker-projects-${workerId.value}`,
  () => loadEnabledProjects(),
)
const enabledProjectRows = computed(() => (enabledProjects.value ?? []).map(({ project, enabledAt }) => ({
  id: project.id,
  name: project.name,
  enabled: formatDateTime(enabledAt),
})))
const enabledProjectColumns = [
  { key: 'name', label: 'Project' },
  { key: 'id', label: 'Project ID', width: '40%' },
  { key: 'enabled', label: 'Enabled' },
]

async function loadEnabledProjects(): Promise<Array<{ project: ProjectResponse, enabledAt: string }>> {
  const projects = await api.projects.list()
  const projectWorkers = await Promise.all(projects.map(async project => ({
    project,
    workers: await api.workers.listForProject(project.id),
  })))

  return projectWorkers.flatMap(({ project, workers }) => {
    const enablement = workers.find(candidate => candidate.id === workerId.value)
    return enablement ? [{ project, enabledAt: enablement.enabled_at }] : []
  })
}

definePageMeta({ layout: 'app' })

useHead(() => ({
  title: worker.value
    ? `Worker ${worker.value.id} · Looping Louie`
    : 'Worker · Looping Louie',
}))
</script>

<template>
  <PageShell
    title="Worker"
    :breadcrumbs="worker ? [{ label: 'Workers', to: '/workers' }, { label: worker.id }] : []"
    :show-heading="Boolean(worker)"
  >
    <UiAsyncStage
      :status="status"
      :error-label="error?.message ?? 'The Worker could not be loaded.'"
      @retry="() => refresh()"
    >
      <dl v-if="worker" class="worker-details">
        <div>
          <dt>Worker ID</dt>
          <dd><code>{{ worker.id }}</code></dd>
        </div>
        <div>
          <dt>Registered</dt>
          <dd>{{ formatDateTime(worker.registered_at) }}</dd>
        </div>
        <div>
          <dt>Last heartbeat</dt>
          <dd>{{ formatDateTime(worker.last_heartbeat_at) }}</dd>
        </div>
        <div>
          <dt>Harnesses</dt>
          <dd class="worker-details__harnesses">
            <UiPill v-for="harness in worker.harnesses" :key="harness.kind" :focusable="false">
              {{ harness.kind }}
            </UiPill>
            <span v-if="!worker.harnesses.length">No Harnesses reported.</span>
          </dd>
        </div>
      </dl>

      <section v-if="worker" class="worker-projects" aria-labelledby="worker-projects-title">
        <div class="worker-projects__heading">
          <div>
            <h2 id="worker-projects-title">Enabled Projects</h2>
            <p>Projects where this Worker can claim work.</p>
          </div>
          <UiButton
            variant="stroke"
            size="sm"
            :loading="enabledProjectsStatus === 'pending'"
            @click="() => refreshEnabledProjects()"
          >Refresh</UiButton>
        </div>

        <div v-if="enabledProjectsStatus === 'pending'" class="worker-projects__state" role="status">
          Loading enabled Projects…
        </div>
        <div v-else-if="enabledProjectsError" class="worker-projects__state worker-projects__state--error" role="alert">
          <span>Enabled Projects could not be loaded.</span>
          <UiButton variant="stroke" size="sm" @click="() => refreshEnabledProjects()">Retry</UiButton>
        </div>
        <div v-else-if="!enabledProjectRows.length" class="worker-projects__state">
          This Worker is not enabled for an accessible Project.
        </div>
        <UiTable
          v-else
          :columns="enabledProjectColumns"
          :rows="enabledProjectRows"
          caption="Projects enabled for this Worker"
        >
          <template #cell-name="{ value, row }">
            <NuxtLink class="project-link" :to="`/projects/${encodeURIComponent(String(row.id))}`">{{ value }}</NuxtLink>
          </template>
          <template #cell-id="{ value }"><code>{{ value }}</code></template>
        </UiTable>
      </section>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.worker-details {
  display: grid;
  gap: var(--ll-space-4);
  padding: var(--ll-space-6);
}

.worker-details > div {
  display: grid;
  gap: var(--ll-space-2);
}

.worker-details dt {
  color: var(--ll-color-text-faint);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.worker-details dd {
  margin: 0;
  color: var(--ll-color-ink);
  font: 500 var(--ll-text-base) / 1.5 var(--ll-font-control);
}

.worker-details code {
  font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono);
  overflow-wrap: anywhere;
}

.worker-details__harnesses {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ll-space-2);
}

.worker-projects {
  display: grid;
  gap: var(--ll-space-5);
  padding: var(--ll-space-6);
  border-top: 1px solid var(--ll-color-divider);
}

.worker-projects__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-4);
}

.worker-projects h2,
.worker-projects p {
  margin: 0;
}

.worker-projects h2 {
  color: var(--ll-color-ink);
  font-size: 1.125rem;
  font-weight: 650;
  line-height: 1.2;
}

.worker-projects p,
.worker-projects__state {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

.worker-projects p {
  margin-top: var(--ll-space-1);
}

.worker-projects__state {
  display: flex;
  min-height: 7rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-4);
  background: var(--ll-color-metal-025);
  text-align: center;
}

.worker-projects__state--error {
  color: var(--ll-color-brand-ink);
}

.project-link {
  color: var(--ll-color-ink);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

@media (max-width: 36rem) {
  .worker-projects__heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
