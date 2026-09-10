<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'

type AsyncStageStatus = 'idle' | 'pending' | 'success' | 'error'
type SectionStageInverse = 'none' | 'top' | 'bottom' | 'both'

withDefaults(defineProps<{
  status?: AsyncStageStatus
  empty?: boolean
  inverse?: SectionStageInverse
  loadingLabel?: string
  errorLabel?: string
  emptyLabel?: string
  retryLabel?: string
  showRetry?: boolean
}>(), {
  status: 'success',
  empty: false,
  inverse: 'bottom',
  loadingLabel: 'Loading…',
  errorLabel: 'Content could not be loaded.',
  emptyLabel: 'Nothing to show yet.',
  retryLabel: 'Retry',
  showRetry: true,
})

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="ui-async-stage"
    :aria-busy="(status === 'pending' || status === 'idle') ? 'true' : undefined"
  >
    <div v-if="status === 'pending' || status === 'idle'" class="ui-async-stage__state" role="status">
      <slot name="loading">{{ loadingLabel }}</slot>
    </div>

    <div v-else-if="status === 'error'" class="ui-async-stage__state ui-async-stage__state--error" role="alert">
      <slot name="error">
        <span>{{ errorLabel }}</span>
        <UiButton v-if="showRetry" variant="stroke" size="sm" @click="$emit('retry')">
          {{ retryLabel }}
        </UiButton>
      </slot>
    </div>

    <UiSectionStage v-else :inverse="inverse" class="ui-async-stage__stage">
      <div v-if="empty" class="ui-async-stage__state ui-async-stage__state--empty">
        <slot name="empty">{{ emptyLabel }}</slot>
      </div>
      <slot v-else />
    </UiSectionStage>
  </div>
</template>

<style scoped>
.ui-async-stage {
  width: 100%;
  min-width: 0;
}

.ui-async-stage__stage :deep(.ui-section-stage__shell) {
  width: 100%;
  margin-inline: 0;
}

.ui-async-stage__state {
  display: flex;
  min-height: 10rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  box-sizing: border-box;
  padding: var(--ll-space-6);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
  font-size: var(--ll-text-sm);
  text-align: center;
}

.ui-async-stage__state--error {
  color: var(--ll-color-brand-ink);
}

.ui-async-stage__state--empty {
  background: transparent;
}
</style>
