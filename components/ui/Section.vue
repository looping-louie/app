<script setup lang="ts">
type SectionSpace = 'none' | 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  as?: string
  space?: SectionSpace
}>(), {
  as: 'section',
  space: 'md',
})
</script>

<template>
  <component
    :is="as"
    class="ui-section"
    :class="`ui-section--space-${space}`"
  >
    <div class="ui-section__inner"><slot /></div>
  </component>
</template>

<style scoped>
.ui-section {
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--ll-color-canvas);
}

.ui-section__inner {
  width: 100%;
  box-sizing: border-box;
}

.ui-section--space-none .ui-section__inner {
  padding-block: 0;
}

.ui-section--space-sm .ui-section__inner {
  padding-block: clamp(3rem, 6vw, 5rem);
}

.ui-section--space-md .ui-section__inner {
  padding-block: clamp(4.5rem, 8vw, 7.5rem);
}

.ui-section--space-lg .ui-section__inner {
  padding-block: clamp(6rem, 12vw, 10rem);
}
</style>
