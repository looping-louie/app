<script setup lang="ts">
type ContainerSize = 'reading' | 'default' | 'wide' | 'full'

withDefaults(defineProps<{
  as?: string
  size?: ContainerSize
}>(), {
  as: 'div',
  size: 'default',
})
</script>

<template>
  <component
    :is="as"
    class="ui-container"
    :class="`ui-container--${size}`"
  >
    <slot />
  </component>
</template>

<style scoped>
.ui-container {
  --ui-container-content-width: 78rem;
  --ui-container-gutter: clamp(1.125rem, 2vw, 1.5rem);

  width: 100%;
  box-sizing: border-box;
  max-width: calc(var(--ui-container-content-width) + (var(--ui-container-gutter) * 2));
  margin-inline: auto;
  padding-inline: var(--ui-container-gutter);
}

.ui-container--reading {
  --ui-container-content-width: 48rem;
}

.ui-container--default {
  --ui-container-content-width: 78rem;
}

.ui-container--wide {
  --ui-container-content-width: 83rem;
}

.ui-container--full {
  max-width: none;
}
</style>
