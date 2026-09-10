<script setup lang="ts">
type CardVariant = 'media' | 'editorial' | 'row'

const props = withDefaults(defineProps<{
  as?: string
  variant?: CardVariant
  to?: string
  href?: string
  accentOnHover?: boolean
}>(), {
  as: 'article',
  variant: 'editorial',
  to: undefined,
  href: undefined,
  accentOnHover: false,
})

const rootComponent = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return props.as
})

const linkBindings = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href }
  return {}
})
</script>

<template>
  <component
    :is="rootComponent"
    v-bind="linkBindings"
    class="ui-card"
    :class="[
      `ui-card--${variant}`,
      {
        'ui-card--interactive': to || href,
        'ui-card--accent-on-hover': accentOnHover,
      },
    ]"
  >
    <div class="ui-card__content">
      <div v-if="$slots.eyebrow" class="ui-card__eyebrow"><slot name="eyebrow" /></div>
      <div v-if="$slots.title" class="ui-card__title"><slot name="title" /></div>
      <div v-if="$slots.description" class="ui-card__description"><slot name="description" /></div>
      <div v-if="$slots.meta || $slots.trailing" class="ui-card__footer">
        <div v-if="$slots.meta" class="ui-card__meta"><slot name="meta" /></div>
        <div v-if="$slots.trailing" class="ui-card__trailing"><slot name="trailing" /></div>
      </div>
    </div>

    <div v-if="$slots.media" class="ui-card__media">
      <div class="ui-card__media-default"><slot name="media" /></div>
      <div v-if="$slots['media-hover']" class="ui-card__media-hover" aria-hidden="true">
        <slot name="media-hover" />
      </div>
    </div>
  </component>
</template>

<style scoped>
.ui-card {
  display: flex;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
  text-decoration: none;
}

.ui-card--media,
.ui-card--editorial {
  min-height: 18rem;
  flex-direction: column;
}

.ui-card--row {
  min-height: 6rem;
  align-items: stretch;
}

.ui-card__content {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding: var(--ll-space-6);
}

.ui-card--row .ui-card__content {
  flex-direction: row;
  align-items: center;
  gap: var(--ll-space-5);
}

.ui-card__eyebrow {
  margin-bottom: var(--ll-space-3);
  color: var(--ll-color-text-faint);
  font: 550 0.6875rem / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-card__title :deep(:is(h2, h3, h4, p)) {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.ui-card__description {
  margin-top: var(--ll-space-3);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

.ui-card__description :deep(p) {
  margin: 0;
}

.ui-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
  margin-top: auto;
  padding-top: var(--ll-space-6);
}

.ui-card--row .ui-card__footer {
  flex: 1 1 auto;
  margin: 0;
  padding: 0;
}

.ui-card__meta {
  color: var(--ll-color-text-faint);
  font-size: var(--ll-text-xs);
}

.ui-card__trailing {
  flex: none;
  margin-left: auto;
}

.ui-card__media {
  position: relative;
  min-height: 11rem;
  overflow: hidden;
  margin: 0 var(--ll-space-3) var(--ll-space-3);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: calc(var(--ui-surface-radius, var(--ll-radius-structural)) - 0.375rem);
}

.ui-card__media-default,
.ui-card__media-hover {
  position: absolute;
  inset: 0;
}

.ui-card__media-hover {
  opacity: 0;
  transition: opacity var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-card--interactive {
  cursor: pointer;
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-card--interactive:hover,
.ui-card--interactive:focus-visible {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.ui-card--interactive:hover .ui-card__media-hover,
.ui-card--interactive:focus-visible .ui-card__media-hover {
  opacity: 1;
}

.ui-card--accent-on-hover:is(:hover, :focus-visible) .ui-card__eyebrow {
  color: var(--ll-color-primary);
}

.ui-card--accent-on-hover:is(:hover, :focus-visible) :deep(.ui-status-text--card-hover.ui-status-text--enabled) {
  color: var(--ll-color-status-enabled);
}

.ui-card--accent-on-hover:is(:hover, :focus-visible) :deep(.ui-status-text--card-hover.ui-status-text--disabled) {
  color: var(--ll-color-status-disabled);
}

.ui-card--interactive:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}

@media (max-width: 44rem) {
  .ui-card--row .ui-card__content {
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-card__media-hover,
  .ui-card__eyebrow,
  .ui-card--interactive {
    transition: none;
  }
}
</style>
