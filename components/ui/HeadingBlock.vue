<script setup lang="ts">
type HeadingLayout = 'centered' | 'split'
type HeadingSize = 'hero' | 'section' | 'subsection'
type HeadingAlign = 'center' | 'start'

const props = withDefaults(defineProps<{
  layout?: HeadingLayout
  size?: HeadingSize
  align?: HeadingAlign
}>(), {
  layout: 'centered',
  size: 'section',
})

const resolvedAlign = computed<HeadingAlign>(() => (
  props.align ?? (props.layout === 'centered' ? 'center' : 'start')
))
</script>

<template>
  <div
    class="ui-heading-block"
    :class="[
      `ui-heading-block--${layout}`,
      `ui-heading-block--${size}`,
      `ui-heading-block--align-${resolvedAlign}`,
    ]"
  >
    <div class="ui-heading-block__content">
      <div v-if="$slots.eyebrow" class="ui-heading-block__eyebrow">
        <slot name="eyebrow" />
      </div>

      <div v-if="$slots.title" class="ui-heading-block__title">
        <slot name="title" />
      </div>

      <div v-if="$slots.description" class="ui-heading-block__description">
        <slot name="description" />
      </div>

      <div v-if="$slots.actions" class="ui-heading-block__actions">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="layout === 'split' && $slots.aside" class="ui-heading-block__aside">
      <slot name="aside" />
    </div>
  </div>
</template>

<style scoped>
.ui-heading-block {
  width: 100%;
  color: var(--ll-color-ink);
}

.ui-heading-block__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.ui-heading-block--centered {
  display: flex;
  justify-content: center;
}

.ui-heading-block--centered .ui-heading-block__content {
  width: 100%;
  max-width: 52rem;
}

.ui-heading-block--split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.72fr);
  align-items: end;
  gap: clamp(2rem, 7vw, 7rem);
}

.ui-heading-block--split .ui-heading-block__content {
  max-width: 42rem;
}

.ui-heading-block--align-center .ui-heading-block__content {
  align-items: center;
  text-align: center;
}

.ui-heading-block--align-start .ui-heading-block__content {
  align-items: flex-start;
  text-align: left;
}

.ui-heading-block__eyebrow {
  margin-bottom: var(--ll-space-4);
  color: var(--ll-color-primary);
  font-size: 0.8125rem;
  font-weight: 650;
  line-height: 1.2;
}

.ui-heading-block__title {
  width: 100%;
}

.ui-heading-block__title :deep(:is(h1, h2, h3, p)) {
  margin: 0;
  color: inherit;
  font-family: var(--ll-font-display);
  font-weight: 620;
  text-wrap: balance;
}

.ui-heading-block--hero .ui-heading-block__title :deep(:is(h1, h2, h3, p)) {
  font-size: clamp(2.75rem, 6vw, 4.75rem);
  line-height: 0.99;
  letter-spacing: -0.055em;
}

.ui-heading-block--section .ui-heading-block__title :deep(:is(h1, h2, h3, p)) {
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.03;
  letter-spacing: -0.045em;
}

.ui-heading-block--subsection .ui-heading-block__title :deep(:is(h1, h2, h3, p)) {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.05;
  letter-spacing: -0.035em;
}

.ui-heading-block__description {
  width: 100%;
  max-width: 40rem;
  margin-top: var(--ll-space-5);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-md);
  line-height: 1.6;
  text-wrap: balance;
}

.ui-heading-block__description :deep(p) {
  margin: 0;
}

.ui-heading-block__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-3);
  margin-top: var(--ll-space-6);
}

.ui-heading-block__aside {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
}

@media (max-width: 48rem) {
  .ui-heading-block--split {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: var(--ll-space-8);
  }

  .ui-heading-block__aside {
    width: 100%;
    align-items: flex-start;
  }
}
</style>
