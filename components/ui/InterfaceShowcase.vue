<script setup lang="ts">
interface InterfaceTab {
  value: string
  label: string
  description: string
  mark?: string
}

const props = defineProps<{
  tabs: InterfaceTab[]
  modelValue?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const componentId = useId()
const internalValue = ref(props.modelValue || props.tabs[0]?.value || '')

watch(() => props.modelValue, (value) => {
  if (value !== undefined) internalValue.value = value
})

const activeValue = computed(() => props.modelValue ?? internalValue.value)
const activeTab = computed(() => props.tabs.find(tab => tab.value === activeValue.value) || props.tabs[0])

function select(value: string) {
  internalValue.value = value
  emit('update:modelValue', value)
}

function tabId(value: string) {
  return `${componentId}-tab-${value}`
}

function panelId(value: string) {
  return `${componentId}-panel-${value}`
}

function handleKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()

  let nextIndex = index
  if (event.key === 'ArrowLeft') nextIndex = (index - 1 + props.tabs.length) % props.tabs.length
  if (event.key === 'ArrowRight') nextIndex = (index + 1) % props.tabs.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = props.tabs.length - 1

  const next = props.tabs[nextIndex]
  if (!next) return
  select(next.value)
  nextTick(() => document.getElementById(tabId(next.value))?.focus())
}
</script>

<template>
  <div class="ui-interface-showcase">
    <div
      class="ui-interface-showcase__tabs"
      role="tablist"
      :aria-label="ariaLabel || 'Interface views'"
    >
      <button
        v-for="(tab, index) in tabs"
        :id="tabId(tab.value)"
        :key="tab.value"
        type="button"
        role="tab"
        class="ui-interface-showcase__tab"
        :class="{ 'is-active': tab.value === activeValue }"
        :aria-selected="tab.value === activeValue"
        :aria-controls="panelId(tab.value)"
        :tabindex="tab.value === activeValue ? 0 : -1"
        @click="select(tab.value)"
        @keydown="handleKeydown($event, index)"
      >
        <span aria-hidden="true">{{ tab.mark || '✦' }}</span>
        {{ tab.label }}
      </button>
    </div>

    <Transition name="ui-interface-panel" mode="out-in">
      <section
        v-if="activeTab"
        :id="panelId(activeTab.value)"
        :key="activeTab.value"
        class="ui-interface-showcase__panel"
        role="tabpanel"
        :aria-labelledby="tabId(activeTab.value)"
      >
        <div class="ui-interface-showcase__viewport">
          <slot name="panel" :item="activeTab" />
        </div>
        <footer class="ui-interface-showcase__caption">
          <strong>{{ activeTab.label }}</strong>
          <p>{{ activeTab.description }}</p>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.ui-interface-showcase {
  --ui-interface-panel: #ffffff;

  position: relative;
  padding: var(--ll-space-5);
  overflow: hidden;
  background: var(--ll-color-section-subtle);
  border: 1px solid var(--ll-color-border);
  border-radius: 2rem;
}

.ui-interface-showcase__tabs {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(8rem, 1fr));
  gap: var(--ll-space-3);
  overflow-x: auto;
  padding: 0 var(--ll-space-3);
  scrollbar-width: none;
}

.ui-interface-showcase__tabs::-webkit-scrollbar {
  display: none;
}

.ui-interface-showcase__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-height: 4.75rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-3);
  padding: 0 var(--ll-space-5);
  color: var(--ll-color-text-muted);
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid transparent;
  border-radius: var(--ll-radius-pill);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    border-radius 220ms var(--ll-ease-out),
    transform 220ms var(--ll-ease-out);
}

.ui-interface-showcase__tab > span {
  font-size: 1.25rem;
}

.ui-interface-showcase__tab:hover {
  color: var(--ll-color-ink);
  background: rgba(255, 255, 255, 0.82);
}

.ui-interface-showcase__tab.is-active {
  z-index: 3;
  color: var(--ll-color-ink);
  background: var(--ui-interface-panel);
  border-color: var(--ll-color-border-strong);
  border-bottom-color: var(--ui-interface-panel);
  border-radius: var(--ll-radius-lg) var(--ll-radius-lg) 0 0;
  transform: translateY(var(--ll-space-3));
}

.ui-interface-showcase__tab.is-active::before,
.ui-interface-showcase__tab.is-active::after {
  position: absolute;
  bottom: -1px;
  width: 1.25rem;
  height: 1.25rem;
  pointer-events: none;
  content: '';
}

.ui-interface-showcase__tab.is-active::before {
  left: -1.25rem;
  border-bottom-right-radius: 1.25rem;
  box-shadow: 0.5rem 0.5rem 0 0.25rem var(--ui-interface-panel);
}

.ui-interface-showcase__tab.is-active::after {
  right: -1.25rem;
  border-bottom-left-radius: 1.25rem;
  box-shadow: -0.5rem 0.5rem 0 0.25rem var(--ui-interface-panel);
}

.ui-interface-showcase__tab:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: -3px;
}

.ui-interface-showcase__panel {
  position: relative;
  z-index: 1;
  overflow: hidden;
  margin-top: var(--ll-space-3);
  background: var(--ui-interface-panel);
  border: 1px solid var(--ll-color-border-strong);
  border-radius: var(--ll-radius-lg);
  box-shadow: 0 2rem 4rem rgba(41, 47, 51, 0.1);
}

.ui-interface-showcase__viewport {
  position: relative;
  min-height: clamp(24rem, 48vw, 38rem);
  overflow: hidden;
  background:
    linear-gradient(rgba(41, 47, 51, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(41, 47, 51, 0.035) 1px, transparent 1px),
    var(--ll-color-surface-raised);
  background-size: 2rem 2rem;
  border-bottom: 1px solid var(--ll-color-border);
}

.ui-interface-showcase__caption {
  display: grid;
  grid-template-columns: minmax(8rem, 0.35fr) minmax(0, 1fr);
  gap: var(--ll-space-8);
  padding: var(--ll-space-6);
}

.ui-interface-showcase__caption strong {
  font-size: var(--ll-text-md);
  font-weight: 650;
}

.ui-interface-showcase__caption p {
  max-width: 42rem;
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.55;
}

.ui-interface-panel-enter-active,
.ui-interface-panel-leave-active {
  transition:
    opacity 140ms ease,
    transform 180ms var(--ll-ease-out);
}

.ui-interface-panel-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}

.ui-interface-panel-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (max-width: 48rem) {
  .ui-interface-showcase {
    padding: var(--ll-space-3);
    border-radius: var(--ll-radius-lg);
  }

  .ui-interface-showcase__tabs {
    grid-template-columns: repeat(5, 8.75rem);
    justify-content: start;
    padding-inline: 0;
  }

  .ui-interface-showcase__tab {
    min-height: 3.75rem;
  }

  .ui-interface-showcase__caption {
    grid-template-columns: 1fr;
    gap: var(--ll-space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-interface-showcase__tab,
  .ui-interface-panel-enter-active,
  .ui-interface-panel-leave-active {
    transition: none;
  }
}
</style>
