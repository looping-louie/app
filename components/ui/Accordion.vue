<script setup lang="ts">
interface AccordionItem {
  id: string
  title: string
  content: string
}

const props = withDefaults(defineProps<{
  items: AccordionItem[]
  defaultOpen?: string[]
  allowMultiple?: boolean
}>(), {
  defaultOpen: () => [],
  allowMultiple: false,
})

const instanceId = useId().replaceAll(':', '')
const openIds = ref(new Set(props.defaultOpen))

function isOpen(id: string) {
  return openIds.value.has(id)
}

function toggle(id: string) {
  const next = props.allowMultiple ? new Set(openIds.value) : new Set<string>()
  if (openIds.value.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}
</script>

<template>
  <div class="ui-accordion">
    <div v-for="item in items" :key="item.id" class="ui-accordion__item">
      <h3 class="ui-accordion__heading">
        <button
          type="button"
          class="ui-accordion__trigger"
          :aria-expanded="isOpen(item.id)"
          :aria-controls="`${instanceId}-${item.id}-panel`"
          :id="`${instanceId}-${item.id}-trigger`"
          @click="toggle(item.id)"
        >
          <span>{{ item.title }}</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6.5 8 10l4-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </h3>
      <div
        :id="`${instanceId}-${item.id}-panel`"
        class="ui-accordion__panel"
        :class="{ 'ui-accordion__panel--open': isOpen(item.id) }"
        role="region"
        :aria-labelledby="`${instanceId}-${item.id}-trigger`"
      >
        <div><p>{{ item.content }}</p></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-accordion {
  overflow: hidden;
  background: var(--ll-color-surface-raised);
  border: 1px solid var(--ll-color-border);
  border-radius: var(--ll-radius-lg);
}

.ui-accordion__item + .ui-accordion__item {
  border-top: 1px solid var(--ll-color-border);
}

.ui-accordion__heading {
  margin: 0;
}

.ui-accordion__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-5) var(--ll-space-6);
  color: var(--ll-color-ink);
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: var(--ll-text-sm);
  font-weight: 620;
  line-height: 1.35;
  text-align: left;
}

.ui-accordion__trigger:hover {
  background: var(--ll-color-surface);
}

.ui-accordion__trigger:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--ll-color-primary);
  outline-offset: -2px;
}

.ui-accordion__trigger svg {
  width: 1rem;
  height: 1rem;
  flex: none;
  color: var(--ll-color-text-muted);
  transition: transform var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-accordion__trigger[aria-expanded="true"] svg {
  transform: rotate(180deg);
}

.ui-accordion__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-accordion__panel--open {
  grid-template-rows: 1fr;
}

.ui-accordion__panel > div {
  overflow: hidden;
}

.ui-accordion__panel p {
  max-width: 48rem;
  margin: 0;
  padding: 0 var(--ll-space-6) var(--ll-space-5);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .ui-accordion__trigger svg,
  .ui-accordion__panel {
    transition: none;
  }
}
</style>
