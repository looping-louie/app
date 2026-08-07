<script setup lang="ts">
type GridColumns = 2 | 3 | 4
type GridGap = 'sm' | 'md' | 'lg'
type GridCollapse = 'responsive' | 'never'

withDefaults(defineProps<{
  as?: string
  columns?: GridColumns
  gap?: GridGap
  collapse?: GridCollapse
}>(), {
  as: 'div',
  columns: 3,
  gap: 'md',
  collapse: 'responsive',
})
</script>

<template>
  <component
    :is="as"
    class="ui-grid"
    :class="[
      `ui-grid--columns-${columns}`,
      `ui-grid--gap-${gap}`,
      `ui-grid--collapse-${collapse}`,
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.ui-grid {
  --ui-grid-columns: 3;
  --ui-grid-gap: var(--ll-space-5);

  display: grid;
  min-width: 0;
  grid-template-columns: repeat(var(--ui-grid-columns), minmax(0, 1fr));
  gap: var(--ui-grid-gap);
}

.ui-grid--columns-2 { --ui-grid-columns: 2; }
.ui-grid--columns-3 { --ui-grid-columns: 3; }
.ui-grid--columns-4 { --ui-grid-columns: 4; }
.ui-grid--gap-sm { --ui-grid-gap: var(--ll-space-3); }
.ui-grid--gap-md { --ui-grid-gap: var(--ll-space-5); }
.ui-grid--gap-lg { --ui-grid-gap: var(--ll-space-8); }

@media (max-width: 64rem) {
  .ui-grid--collapse-responsive.ui-grid--columns-3,
  .ui-grid--collapse-responsive.ui-grid--columns-4 {
    --ui-grid-columns: 2;
  }
}

@media (max-width: 44rem) {
  .ui-grid--collapse-responsive {
    --ui-grid-columns: 1;
  }
}
</style>
