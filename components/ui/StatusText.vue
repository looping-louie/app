<script setup lang="ts">
type StatusTone = 'enabled' | 'disabled'
type StatusActivation = 'always' | 'card-hover'

withDefaults(defineProps<{
  tone: StatusTone
  activation?: StatusActivation
}>(), {
  activation: 'always',
})
</script>

<template>
  <span
    class="ui-status-text"
    :class="[
      `ui-status-text--${tone}`,
      `ui-status-text--${activation}`,
    ]"
  >
    <slot />
  </span>
</template>

<style scoped>
.ui-status-text {
  color: inherit;
  transition: color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-status-text--always.ui-status-text--enabled {
  color: var(--ll-color-status-enabled);
}

.ui-status-text--always.ui-status-text--disabled {
  color: var(--ll-color-status-disabled);
}

@media (prefers-reduced-motion: reduce) {
  .ui-status-text {
    transition: none;
  }
}
</style>
