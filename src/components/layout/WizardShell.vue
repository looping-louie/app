<script setup lang="ts">
import UiContainer from '~/components/ui/Container.vue'
import UiFormProgress from '~/components/ui/FormProgress.vue'

type ContainerSize = 'reading' | 'default' | 'wide' | 'full'

withDefaults(defineProps<{
  steps: string[]
  current: number
  savedLabel?: string
  containerSize?: ContainerSize
}>(), {
  savedLabel: undefined,
  containerSize: 'wide',
})
</script>

<template>
  <UiContainer :size="containerSize" class="layout-wizard-shell">
    <header class="layout-wizard-shell__progress">
      <UiFormProgress :steps="steps" :current="current" :saved-label="savedLabel" />
    </header>
    <slot />
  </UiContainer>
</template>

<style scoped>
.layout-wizard-shell {
  padding-block:
    var(--layout-wizard-shell-padding-start, var(--ll-space-6))
    var(--layout-wizard-shell-padding-end, var(--ll-space-16));
}

.layout-wizard-shell__progress {
  width: calc(100% + var(--ui-container-gutter));
  margin-bottom: var(--ll-space-10);
}
</style>
