<script setup lang="ts">
interface GridListItem {
  id: string
  to?: string
  href?: string
  target?: string
  rel?: string
  [key: string]: string | undefined
}

type GridListVariant = 'plain' | 'surface'

const props = withDefaults(defineProps<{
  items: GridListItem[]
  variant?: GridListVariant
  ariaLabel?: string
  clickable?: boolean
}>(), {
  variant: 'plain',
  ariaLabel: 'Items',
  clickable: false,
})

const emit = defineEmits<{
  select: [item: GridListItem]
}>()

function itemComponent(item: GridListItem) {
  if (!props.clickable) return 'div'
  if (item.to) return resolveComponent('NuxtLink')
  if (item.href) return 'a'
  return 'button'
}

function itemBindings(item: GridListItem) {
  if (!props.clickable) return {}
  if (item.to) return { to: item.to }
  if (item.href) {
    return {
      href: item.href,
      target: item.target,
      rel: item.rel || (item.target === '_blank' ? 'noopener noreferrer' : undefined),
    }
  }
  return { type: 'button' }
}

function handleSelect(item: GridListItem) {
  if (props.clickable) emit('select', item)
}
</script>

<template>
  <ul
    class="ui-grid-list"
    :class="`ui-grid-list--${variant}`"
    :aria-label="ariaLabel"
  >
    <li v-for="item in items" :key="item.id" class="ui-grid-list__row">
      <component
        :is="itemComponent(item)"
        v-bind="itemBindings(item)"
        class="ui-grid-list__item"
        :class="{ 'ui-grid-list__item--clickable': clickable }"
        @click="handleSelect(item)"
      >
        <div class="ui-grid-list__leading"><slot name="leading" :item="item" /></div>
        <div class="ui-grid-list__metadata"><slot name="metadata" :item="item" /></div>
        <div class="ui-grid-list__trailing"><slot name="trailing" :item="item" /></div>
      </component>
    </li>
  </ul>
</template>

<style scoped>
.ui-grid-list {
  display: grid;
  gap: var(--ll-space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.ui-grid-list__row {
  min-width: 0;
}

.ui-grid-list__item {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: minmax(12rem, 1.1fr) minmax(12rem, 1fr) auto;
  align-items: center;
  gap: var(--ll-space-6);
  padding: var(--ll-space-4) var(--ll-space-5);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ll-radius-lg);
  appearance: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-grid-list__item--clickable {
  cursor: pointer;
}

.ui-grid-list__item--clickable:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.ui-grid-list--surface .ui-grid-list__item {
  min-height: 5.25rem;
  background: var(--ll-color-surface-raised);
  border: 1px solid var(--ll-color-border);
}

.ui-grid-list--plain .ui-grid-list__item {
  min-height: 6rem;
  padding-block: var(--ll-space-6);
}

.ui-grid-list__item:hover,
.ui-grid-list__item:focus-within {
  background: #ffffff;
  border-color: var(--ll-color-border-strong);
  box-shadow: var(--ll-shadow-raised);
}

.ui-grid-list__leading,
.ui-grid-list__metadata,
.ui-grid-list__trailing {
  min-width: 0;
}

.ui-grid-list__metadata {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}

.ui-grid-list__trailing {
  justify-self: end;
}

@media (max-width: 44rem) {
  .ui-grid-list__item {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--ll-space-3) var(--ll-space-4);
  }

  .ui-grid-list__metadata {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-grid-list__item {
    transition: none;
  }
}
</style>
