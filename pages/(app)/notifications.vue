<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'

definePageMeta({
  layout: 'app',
})

const {
  error,
  notifications,
  refresh,
  status,
} = useHumanGateNotifications()
const { formatDateTime } = useDateTime()

await refresh()

useHead({
  title: 'Notifications · Looping Louie',
})
</script>

<template>
  <PageShell
    title="Notifications"
    description="Human gates that need your input before their pipelines can continue."
  >
    <UiAsyncStage
      :status="status"
      :empty="status === 'success' && notifications.length === 0"
      loading-label="Checking human gates…"
      empty-label="No human gates need your input."
      @retry="refresh"
    >
      <template #error>
        <span>{{ error }}</span>
        <UiButton variant="stroke" size="sm" @click="refresh">Retry</UiButton>
      </template>

      <ol class="human-gate-list" aria-label="Pending human gates">
        <li v-for="notification in notifications" :key="notification.id">
          <NuxtLink :to="notification.to" class="human-gate-alert">
            <span class="human-gate-alert__icon" aria-hidden="true">
              <svg viewBox="0 0 256 256" fill="currentColor">
                <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm8-120v40a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm4,72a12,12,0,1,1-12-12A12,12,0,0,1,140,168Z" />
              </svg>
            </span>
            <span class="human-gate-alert__copy">
              <strong>{{ notification.runLabel }}</strong>
              <span>{{ notification.projectName }} · Waiting for approval or quiz input</span>
              <small>Updated {{ formatDateTime(notification.updatedAt) }}</small>
            </span>
            <span class="human-gate-alert__action">
              Open gate
              <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
              </svg>
            </span>
          </NuxtLink>
        </li>
      </ol>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.human-gate-list {
  display: grid;
  gap: var(--ll-space-3);
  padding: 0;
  margin: 0;
  list-style: none;
}

.human-gate-alert {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ll-space-4);
  padding: var(--ll-space-5);
  color: var(--ll-color-ink);
  background: color-mix(in srgb, var(--ll-color-red-100) 58%, var(--ll-color-card));
  border: 1px solid color-mix(in srgb, var(--ll-color-brand) 24%, var(--ll-color-divider));
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
  text-decoration: none;
  transition: background var(--ll-duration-normal) var(--ll-ease-out);
}

.human-gate-alert:hover {
  background: color-mix(in srgb, var(--ll-color-red-100) 78%, var(--ll-color-card));
}

.human-gate-alert:focus-visible {
  outline: 2px solid var(--ll-color-brand);
  outline-offset: 3px;
}

.human-gate-alert__icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--ll-color-brand-ink);
  background: var(--ll-color-red-100);
  border-radius: 50%;
}

.human-gate-alert__icon svg {
  width: 1.35rem;
  height: 1.35rem;
}

.human-gate-alert__copy {
  display: grid;
  gap: var(--ll-space-1);
  min-width: 0;
}

.human-gate-alert__copy strong {
  overflow: hidden;
  font-size: var(--ll-text-md);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.human-gate-alert__copy span,
.human-gate-alert__copy small {
  color: color-mix(in srgb, var(--ll-color-brand-ink) 72%, var(--ll-color-text-muted));
  font-size: var(--ll-text-sm);
  line-height: 1.4;
}

.human-gate-alert__copy small {
  font-size: var(--ll-text-xs);
  font-variant-numeric: tabular-nums;
}

.human-gate-alert__action {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-2);
  color: var(--ll-color-brand-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
  white-space: nowrap;
}

.human-gate-alert__action svg {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 42rem) {
  .human-gate-alert {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .human-gate-alert__action {
    grid-column: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .human-gate-alert {
    transition: none;
  }
}
</style>
