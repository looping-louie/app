<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiNotification from '~/components/ui/Notification.vue'

withDefaults(defineProps<{
  description?: string
  loading?: boolean
}>(), {
  description: 'The latest run or event refresh failed. Last known data remains visible.',
  loading: false,
})

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="ui-data-freshness-notice">
    <UiNotification
      tone="error"
      title="Data may be out of date"
      :description="description"
      :dismissible="false"
    />
    <UiButton variant="stroke" size="sm" :loading="loading" @click="$emit('retry')">Retry refresh</UiButton>
  </div>
</template>

<style scoped>
.ui-data-freshness-notice {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-4);
}

.ui-data-freshness-notice :deep(.ui-notification) {
  flex: 1 1 auto;
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
  box-shadow: none;
}

.ui-data-freshness-notice :deep(.ui-button) {
  flex: none;
}

@media (max-width: 40rem) {
  .ui-data-freshness-notice {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
