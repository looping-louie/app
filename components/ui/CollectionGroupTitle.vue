<script setup lang="ts">
const props = withDefaults(defineProps<{
  headingAs?: string
  title: string
  to?: string
  href?: string
}>(), {
  headingAs: 'h4',
  to: undefined,
  href: undefined,
})

const rootComponent = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'div'
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
    class="ui-collection-group-title"
    :class="{ 'ui-collection-group-title--interactive': to || href }"
  >
    <svg
      class="ui-collection-group-title__inverse-corner"
      viewBox="0 0 28 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M28 28H0C15.464 28 28 15.464 28 0V28Z" fill="currentColor" />
    </svg>
    <div class="ui-collection-group-title__surface">
      <div class="ui-collection-group-title__control">
        <component :is="headingAs" class="ui-collection-group-title__heading">
          <slot>{{ title }}</slot>
        </component>
        <svg
          v-if="to || href"
          class="ui-collection-group-title__icon"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" />
        </svg>
      </div>
    </div>
    <svg
      class="ui-collection-group-title__inverse-corner ui-collection-group-title__inverse-corner--end"
      viewBox="0 0 28 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M28 28H0C15.464 28 28 15.464 28 0V28Z" fill="currentColor" />
    </svg>
  </component>
</template>

<style scoped>
.ui-collection-group-title {
  --ui-collection-group-title-padding-top: 0.5rem;
  --ui-collection-group-title-padding-bottom: 0.25rem;
  --ui-collection-group-title-padding-inline: 1rem;
  --ui-collection-group-title-control-padding-inline: 1.5625rem;
  --ui-collection-group-title-control-height: 1.75rem;
  --ui-collection-group-notch-size: 1.75rem;

  display: flex;
  min-width: 0;
  align-items: flex-end;
  justify-content: center;
  background: var(--ll-color-canvas);
  color: inherit;
  text-decoration: none;
}

.ui-collection-group-title__surface {
  display: flex;
  flex: 0 0 auto;
  box-sizing: border-box;
  align-items: flex-start;
  justify-content: center;
  padding:
    var(--ui-collection-group-title-padding-top)
    var(--ui-collection-group-title-padding-inline)
    var(--ui-collection-group-title-padding-bottom);
  background: var(--ll-color-section);
  border-radius: var(--ui-collection-group-notch-size) var(--ui-collection-group-notch-size) 0 0;
}

.ui-collection-group-title__control {
  position: relative;
  display: flex;
  height: var(--ui-collection-group-title-control-height);
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  padding-inline: var(--ui-collection-group-title-control-padding-inline);
  border-radius: var(--ll-radius-pill);
  transition:
    color 200ms var(--ll-ease-out),
    background 200ms var(--ll-ease-out);
}

.ui-collection-group-title__heading {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  transition: color 200ms var(--ll-ease-out);
}

.ui-collection-group-title__inverse-corner {
  width: var(--ui-collection-group-notch-size);
  height: var(--ui-collection-group-notch-size);
  flex: 0 0 var(--ui-collection-group-notch-size);
  color: var(--ll-color-section);
}

.ui-collection-group-title__inverse-corner--end {
  transform: rotate(90deg);
}

.ui-collection-group-title__icon {
  position: absolute;
  top: 0.375rem;
  right: 0.5rem;
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0;
  color: var(--ll-color-ink);
  transform: translate(-0.25rem, 0.25rem);
  transition:
    opacity 300ms var(--ll-ease-out),
    transform 300ms var(--ll-ease-out);
}

.ui-collection-group-title__icon path {
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ui-collection-group-title--interactive {
  cursor: pointer;
}

.ui-collection-group-title--interactive .ui-collection-group-title__heading {
  color: var(--ll-color-text-muted);
}

.ui-collection-group-title--interactive:hover .ui-collection-group-title__control,
.ui-collection-group-title--interactive:focus-visible .ui-collection-group-title__control {
  background: var(--ll-color-card);
}

.ui-collection-group-title--interactive:hover .ui-collection-group-title__heading,
.ui-collection-group-title--interactive:focus-visible .ui-collection-group-title__heading {
  color: var(--ll-color-ink);
}

.ui-collection-group-title--interactive:hover .ui-collection-group-title__icon,
.ui-collection-group-title--interactive:focus-visible .ui-collection-group-title__icon {
  opacity: 1;
  transform: translate(0, 0);
}

.ui-collection-group-title--interactive:focus-visible {
  border-radius: var(--ui-collection-group-notch-size) var(--ui-collection-group-notch-size) 0 0;
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .ui-collection-group-title__control,
  .ui-collection-group-title__heading,
  .ui-collection-group-title__icon {
    transition: none;
  }
}
</style>
