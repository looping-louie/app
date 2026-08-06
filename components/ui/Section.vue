<script setup lang="ts">
type SectionSurface = 'transparent' | 'canvas' | 'subtle' | 'raised'
type SectionSpace = 'none' | 'sm' | 'md' | 'lg'
type SectionBackdrop = 'none' | 'bottom'

withDefaults(defineProps<{
  as?: string
  surface?: SectionSurface
  space?: SectionSpace
  rounded?: boolean
  backdrop?: SectionBackdrop
}>(), {
  as: 'section',
  surface: 'transparent',
  space: 'md',
  rounded: false,
  backdrop: 'none',
})
</script>

<template>
  <component
    :is="as"
    class="ui-section"
    :class="[
      `ui-section--${surface}`,
      `ui-section--space-${space}`,
      `ui-section--backdrop-${backdrop}`,
      { 'ui-section--rounded': rounded },
    ]"
  >
    <span
      v-if="backdrop === 'bottom'"
      class="ui-section__backdrop"
      aria-hidden="true"
    />
    <div class="ui-section__inner"><slot /></div>
  </component>
</template>

<style scoped>
.ui-section {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.ui-section__inner {
  width: 100%;
  box-sizing: border-box;
}

.ui-section--transparent {
  background: transparent;
}

.ui-section--canvas {
  background: var(--ll-color-canvas);
}

.ui-section--subtle {
  background: var(--ll-color-section-subtle);
}

.ui-section--raised {
  background: var(--ll-color-surface-raised);
}

.ui-section--space-none {
  padding-block: 0;
}

.ui-section--space-sm {
  padding-block: clamp(3rem, 6vw, 5rem);
}

.ui-section--space-md {
  padding-block: clamp(4.5rem, 8vw, 7.5rem);
}

.ui-section--space-lg {
  padding-block: clamp(6rem, 12vw, 10rem);
}

.ui-section--rounded {
  overflow: hidden;
  border: 1px solid var(--ll-color-border);
  border-radius: var(--ll-radius-lg);
}

.ui-section--raised.ui-section--rounded {
  box-shadow: var(--ll-shadow-raised);
}

.ui-section--backdrop-bottom {
  isolation: isolate;
  background: transparent;
}

.ui-section--backdrop-bottom .ui-section__inner {
  position: relative;
  z-index: 1;
}

.ui-section--backdrop-bottom.ui-section--space-none,
.ui-section--backdrop-bottom.ui-section--space-sm,
.ui-section--backdrop-bottom.ui-section--space-md,
.ui-section--backdrop-bottom.ui-section--space-lg {
  padding-block: 0;
}

.ui-section--backdrop-bottom.ui-section--transparent .ui-section__inner {
  background: transparent;
}

.ui-section--backdrop-bottom.ui-section--canvas .ui-section__inner {
  background: var(--ll-color-canvas);
}

.ui-section--backdrop-bottom.ui-section--subtle .ui-section__inner {
  background: var(--ll-color-section-subtle);
}

.ui-section--backdrop-bottom.ui-section--raised .ui-section__inner {
  background: var(--ll-color-surface-raised);
}

.ui-section--backdrop-bottom.ui-section--space-sm .ui-section__inner {
  padding-block: clamp(3rem, 6vw, 5rem);
}

.ui-section--backdrop-bottom.ui-section--space-md .ui-section__inner {
  padding-block: clamp(4.5rem, 8vw, 7.5rem);
}

.ui-section--backdrop-bottom.ui-section--space-lg .ui-section__inner {
  padding-block: clamp(6rem, 12vw, 10rem);
}

.ui-section--backdrop-bottom.ui-section--rounded {
  overflow: visible;
  border: 0;
  border-radius: 0;
}

.ui-section--backdrop-bottom.ui-section--rounded .ui-section__inner {
  overflow: hidden;
  border: 1px solid var(--ll-color-border);
  border-radius: var(--ll-radius-lg);
}

.ui-section--backdrop-bottom.ui-section--raised.ui-section--rounded {
  box-shadow: none;
}

.ui-section--backdrop-bottom.ui-section--raised.ui-section--rounded .ui-section__inner {
  box-shadow: var(--ll-shadow-raised);
}

.ui-section__backdrop {
  position: absolute;
  z-index: 0;
  bottom: 0;
  left: 50%;
  width: 100vw;
  height: clamp(5rem, 12vw, 9rem);
  pointer-events: none;
  background: var(--ll-color-section-backdrop);
  transform: translateX(-50%);
}
</style>
