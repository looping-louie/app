<script setup lang="ts">
const props = withDefaults(defineProps<{
  clickable?: boolean
  ariaLabel?: string
  dropdownLabel?: string
}>(), {
  clickable: false,
  ariaLabel: undefined,
  dropdownLabel: 'Options',
})

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const dropdownId = `ui-icon-pill-${useId().replaceAll(':', '')}`

function toggleDropdown() {
  if (!props.clickable) return
  open.value = !open.value
}

function closeDropdown({ restoreFocus = false } = {}) {
  open.value = false
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) closeDropdown()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) closeDropdown({ restoreFocus: true })
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div
    ref="root"
    class="ui-icon-pill"
    :class="{
      'ui-icon-pill--clickable': clickable,
      'ui-icon-pill--open': open,
    }"
  >
    <button
      v-if="clickable"
      ref="trigger"
      type="button"
      class="ui-icon-pill__trigger"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      :aria-controls="dropdownId"
      @click="toggleDropdown"
    >
      <span class="ui-icon-pill__icon" aria-hidden="true"><slot name="icon" /></span>
      <span class="ui-icon-pill__label"><slot /></span>
    </button>

    <span
      v-else
      class="ui-icon-pill__trigger"
      :aria-label="ariaLabel"
    >
      <span class="ui-icon-pill__icon" aria-hidden="true"><slot name="icon" /></span>
      <span class="ui-icon-pill__label"><slot /></span>
    </span>

    <svg
      v-if="open"
      class="ui-icon-pill__shoulder"
      viewBox="0 0 16 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path class="ui-icon-pill__shoulder-fill" d="M0 0 Q0 16 16 16 H0 Z" />
      <path class="ui-icon-pill__shoulder-stroke" d="M0 0 Q0 16 16 16" vector-effect="non-scaling-stroke" />
    </svg>

    <Transition name="ui-icon-pill-dropdown">
      <div
        v-if="open"
        :id="dropdownId"
        class="ui-icon-pill__dropdown"
        role="group"
        :aria-label="dropdownLabel"
      >
        <slot name="dropdown" :close="closeDropdown" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ui-icon-pill {
  --ui-icon-pill-height: 2rem;
  --ui-icon-pill-surface: var(--ll-color-card);
  --ui-icon-pill-surface-hover: var(--ll-color-highlight);
  --ui-icon-pill-border: var(--ll-color-divider);
  --ui-icon-pill-shoulder: 1rem;
  --ui-icon-pill-dropdown-radius: var(--ll-radius-lg);

  position: relative;
  z-index: 0;
  display: inline-block;
  height: var(--ui-icon-pill-height);
  color: var(--ll-color-ink);
  font-family: var(--ll-font-control);
  vertical-align: middle;
}

.ui-icon-pill--open {
  z-index: 10;
}

.ui-icon-pill__trigger {
  position: relative;
  z-index: 3;
  display: inline-flex;
  height: var(--ui-icon-pill-height);
  box-sizing: border-box;
  align-items: center;
  gap: 0.4375rem;
  padding: 0 0.75rem;
  color: inherit;
  background: var(--ui-icon-pill-surface);
  border: 1px solid var(--ui-icon-pill-border);
  border-radius: var(--ll-radius-pill);
  font: 500 var(--ll-text-sm) / 1 var(--ll-font-control);
  letter-spacing: 0;
  white-space: nowrap;
}

button.ui-icon-pill__trigger {
  appearance: none;
  cursor: pointer;
  transition:
    color var(--ll-duration-normal) var(--ll-ease-out),
    background-color var(--ll-duration-normal) var(--ll-ease-out);
}

button.ui-icon-pill__trigger:hover,
.ui-icon-pill--open .ui-icon-pill__trigger {
  background: var(--ui-icon-pill-surface-hover);
}

button.ui-icon-pill__trigger:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.ui-icon-pill--open .ui-icon-pill__trigger {
  --ui-icon-pill-surface: var(--ui-icon-pill-surface-hover);

  border-bottom-color: transparent;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}

.ui-icon-pill__icon {
  display: grid;
  width: 1rem;
  height: 1rem;
  flex: none;
  place-items: center;
  color: var(--ll-color-text-muted);
}

.ui-icon-pill__icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.ui-icon-pill__shoulder {
  position: absolute;
  z-index: 4;
  top: calc(100% - var(--ui-icon-pill-shoulder) - 1px);
  left: calc(100% - 1px);
  width: var(--ui-icon-pill-shoulder);
  height: var(--ui-icon-pill-shoulder);
  overflow: visible;
  pointer-events: none;
}

.ui-icon-pill__shoulder-fill {
  fill: var(--ui-icon-pill-surface-hover);
}

.ui-icon-pill__shoulder-stroke {
  fill: none;
  stroke: var(--ui-icon-pill-border);
  stroke-width: 1px;
}

.ui-icon-pill--open::after {
  position: absolute;
  z-index: 2;
  top: calc(100% - 1px);
  left: 1px;
  width: calc(100% + var(--ui-icon-pill-shoulder) - 2px);
  height: 2px;
  background: var(--ui-icon-pill-surface-hover);
  pointer-events: none;
  content: '';
}

.ui-icon-pill__dropdown {
  position: absolute;
  z-index: 1;
  top: calc(100% - 1px);
  left: 0;
  width: max(18rem, 100%);
  max-width: calc(100vw - 2rem);
  box-sizing: border-box;
  padding: var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ui-icon-pill-surface-hover);
  border: 1px solid var(--ui-icon-pill-border);
  border-radius: 0 var(--ui-icon-pill-dropdown-radius) var(--ui-icon-pill-dropdown-radius);
  box-shadow: var(--ll-shadow-raised);
  transform-origin: top left;
}

.ui-icon-pill-dropdown-enter-active,
.ui-icon-pill-dropdown-leave-active {
  transition:
    opacity 180ms cubic-bezier(0.55, 0, 1, 0.45),
    transform 220ms cubic-bezier(0.55, 0, 1, 0.45);
}

.ui-icon-pill-dropdown-enter-from,
.ui-icon-pill-dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .ui-icon-pill-dropdown-enter-active,
  .ui-icon-pill-dropdown-leave-active {
    transition: none;
  }
}
</style>
