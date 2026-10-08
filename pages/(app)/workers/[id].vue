<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiPill from '~/components/ui/Pill.vue'

const route = useRoute()
const api = useApiClient()
const { formatDateTime } = useDateTime()
const workerId = computed(() => String(route.params.id))

const { data: worker, status, error, refresh } = await useAsyncData(
  () => `worker-${workerId.value}`,
  () => api.workers.get(workerId.value),
)

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
</style>