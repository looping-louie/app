<script setup lang="ts">
interface AccordionItem {
  id: string
  title: string
  content?: string
}

const props = withDefaults(defineProps<{
  items: AccordionItem[]
  defaultOpen?: string
}>(), {
  defaultOpen: '',
})

const instanceId = useId().replaceAll(':', '')
const openIds = ref(new Set(props.defaultOpen ? [props.defaultOpen] : []))

function isOpen(id: string) {
  return openIds.value.has(id)
}

function toggle(id: string) {
  const next = new Set<string>()
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
            <path d="M6 4 10 8l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
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
        <div>
          <slot name="content" :item="item">
            <p>{{ item.content }}</p>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-accordion {
  overflow: hidden;
  padding: var(--ll-space-6);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
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
  border-radius: calc(var(--ll-radius-structural) / 2);
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
  text-align: left;
  transition: background-color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-accordion__trigger[aria-expanded="false"]:hover,
.ui-accordion__trigger[aria-expanded="false"]:focus-visible {
  background: var(--ll-color-highlight);
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
  transform: rotate(90deg);
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

.ui-accordion__panel > div > p {
  max-width: 48rem;
  margin: 0;
  padding: 0 var(--ll-space-6) var(--ll-space-5);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  .ui-accordion__trigger svg,
  .ui-accordion__panel {
    transition: none;
  }
}
</style>
