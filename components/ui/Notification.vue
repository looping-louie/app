<script setup lang="ts">
import type { NotificationTone } from '~/composables/useNotifications'

const props = withDefaults(defineProps<{
  tone: NotificationTone
  title: string
  description: string
  dismissible?: boolean
  announce?: boolean
}>(), {
  dismissible: true,
  announce: true,
})

defineEmits<{
  dismiss: []
}>()

const accessibilityRole = computed(() => {
  if (!props.announce) return undefined
  return props.tone === 'error' ? 'alert' : 'status'
})
</script>

<template>
  <article
    class="ui-notification"
    :class="`ui-notification--${tone}`"
    :role="accessibilityRole"
    aria-atomic="true"
  >
    <span class="ui-notification__icon" aria-hidden="true">
      <svg v-if="tone === 'success'" viewBox="0 0 256 256" fill="currentColor">
        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
      </svg>
      <svg v-else viewBox="0 0 256 256" fill="currentColor">
        <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
      </svg>
    </span>

    <span class="ui-notification__copy">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
    </span>

    <button
      v-if="dismissible"
      type="button"
      class="ui-notification__dismiss"
      :aria-label="`Dismiss ${title}`"
      @click="$emit('dismiss')"
    >
      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
      </svg>
    </button>
  </article>
</template>

<style scoped>
.ui-notification {
  --ui-notification-accent: var(--ll-color-primary);

  position: relative;
  display: grid;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--ll-space-3);
  padding: var(--ll-space-4);
  overflow: hidden;
  color: var(--ll-color-ink);
  background: var(--ll-color-surface-raised);
  border: 1px solid color-mix(in srgb, var(--ui-notification-accent) 35%, var(--ll-color-divider));
  border-radius: var(--ll-radius-lg) 0 0 var(--ll-radius-lg);
  box-shadow: var(--ll-shadow-raised);
  font-family: var(--ll-font-control);
}

.ui-notification--error {
  --ui-notification-accent: var(--ll-color-brand);
}

.ui-notification__icon {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.0625rem;
  place-items: center;
  color: var(--ui-notification-accent);
}

.ui-notification__icon svg,
.ui-notification__dismiss svg {
  display: block;
  width: 100%;
  height: 100%;
}

.ui-notification__copy {
  display: grid;
  min-width: 0;
  gap: var(--ll-space-1);
}

.ui-notification__copy strong {
  color: var(--ll-color-ink);
  font: 650 var(--ll-text-sm) / 1.25 var(--ll-font-control);
}

.ui-notification__copy > span {
  color: var(--ll-color-text-muted);
  font: 450 var(--ll-text-sm) / 1.45 var(--ll-font-control);
}

.ui-notification__dismiss {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  margin: -0.25rem -0.25rem 0 0;
  padding: 0.375rem;
  place-items: center;
  color: var(--ll-color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition:
    color var(--ll-duration-normal) var(--ll-ease-out),
    background-color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-notification__dismiss:hover {
  color: var(--ll-color-ink);
  background: var(--ll-color-highlight);
}

.ui-notification__dismiss:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .ui-notification__dismiss {
    transition: none;
  }
}
</style>
