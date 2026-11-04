<script setup lang="ts">
import UiNotification from '~/components/ui/Notification.vue'

const { notifications, dismiss } = useNotifications()
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="ui-notification"
      class="ui-notification-viewport"
      aria-label="Notifications"
    >
      <UiNotification
        v-for="notification in notifications"
        :key="notification.id"
        :tone="notification.tone"
        :title="notification.title"
        :description="notification.description"
        @dismiss="dismiss(notification.id)"
      />
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.ui-notification-viewport {
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  display: flex;
  width: min(24rem, 100vw);
  flex-direction: column;
  gap: var(--ll-space-3);
  pointer-events: none;
}

.ui-notification-viewport :deep(.ui-notification) {
  pointer-events: auto;
  transform-origin: top right;
}

.ui-notification-viewport :deep(.ui-notification:first-child) {
  border-radius: 0 0 0 var(--ll-radius-lg);
}

.ui-notification-enter-active,
.ui-notification-leave-active {
  transition:
    opacity 180ms cubic-bezier(0.55, 0, 1, 0.45),
    transform 220ms cubic-bezier(0.55, 0, 1, 0.45);
}

.ui-notification-move {
  transition: transform 220ms var(--ll-ease-out);
}

.ui-notification-enter-from,
.ui-notification-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem) scaleY(0.96);
}

@media (max-width: 38rem) {
  .ui-notification-viewport {
    top: 0;
    right: 0;
    left: var(--ll-space-3);
    width: auto;
  }

  .ui-notification-viewport :deep(.ui-notification) {
    transform-origin: top center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-notification-enter-active,
  .ui-notification-leave-active,
  .ui-notification-move {
    transition: none;
  }
}
</style>
