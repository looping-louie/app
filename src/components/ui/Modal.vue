<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  closeOnBackdrop?: boolean
  showClose?: boolean
}>(), {
  description: undefined,
  closeOnBackdrop: true,
  showClose: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const panel = ref<HTMLElement | null>(null)
const titleId = `ui-modal-title-${useId().replaceAll(':', '')}`
const descriptionId = `ui-modal-description-${useId().replaceAll(':', '')}`
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

function focusableElements() {
  if (!panel.value) return []
  return [...panel.value.querySelectorAll<HTMLElement>(
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )]
}

function close() {
  emit('update:open', false)
  emit('close')
}

function onBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return

  const elements = focusableElements()
  if (!elements.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  const first = elements[0]
  const last = elements.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    const preferred = panel.value?.querySelector<HTMLElement>('[data-autofocus]')
    const target = preferred || focusableElements()[0] || panel.value
    target?.focus()
  } else {
    document.body.style.overflow = previousOverflow
    previousFocus?.focus()
    previousFocus = null
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-modal">
      <div
        v-if="open"
        class="ui-modal"
        @mousedown="onBackdropClick"
      >
        <section
          ref="panel"
          class="ui-modal__panel"
          :class="{ 'ui-modal__panel--has-close': showClose }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @keydown="onKeydown"
          @mousedown.stop
        >
          <button v-if="showClose" type="button" class="ui-modal__close" aria-label="Close dialog" @click="close">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
            </svg>
          </button>
          <div class="ui-modal__body">
            <div v-if="$slots.icon" class="ui-modal__icon" aria-hidden="true">
              <slot name="icon" />
            </div>
            <div class="ui-modal__content">
              <h2 :id="titleId" class="ui-modal__title">{{ title }}</h2>
              <p v-if="description" :id="descriptionId" class="ui-modal__description">
                {{ description }}
              </p>
              <div v-if="$slots.default" class="ui-modal__detail"><slot /></div>
            </div>
          </div>
          <footer v-if="$slots.actions" class="ui-modal__actions">
            <slot name="actions" :close="close" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-modal {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  box-sizing: border-box;
  place-items: center;
  padding: var(--ll-space-4);
  background: color-mix(in srgb, var(--ll-color-ink) 48%, transparent);
  backdrop-filter: blur(0.25rem);
}

.ui-modal__panel {
  --ui-modal-radius: var(--ll-radius-modal);
  --ui-modal-close-size: 2rem;
  --ui-modal-close-radius: calc(var(--ui-modal-close-size) * 0.5);
  --ui-modal-close-inset: calc(var(--ui-modal-radius) - var(--ui-modal-close-radius) - 1px);
  --ui-modal-action-height: 2.125rem;
  --ui-modal-action-radius: calc(var(--ui-modal-action-height) * 0.5);
  --ui-modal-action-inset: calc(var(--ui-modal-radius) - var(--ui-modal-action-radius) - 1px);

  position: relative;
  width: min(100%, 34rem);
  overflow: hidden;
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ui-modal-radius);
  box-shadow: 0 1.5rem 4rem color-mix(in srgb, var(--ll-color-ink) 22%, transparent);
  outline: none;
}

.ui-modal__close {
  position: absolute;
  z-index: 2;
  top: var(--ui-modal-close-inset);
  right: var(--ui-modal-close-inset);
  display: grid;
  width: var(--ui-modal-close-size);
  height: var(--ui-modal-close-size);
  padding: 0;
  place-items: center;
  color: var(--ll-color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ll-radius-pill);
  opacity: 1;
  cursor: pointer;
  transition: color var(--ll-duration-fast) var(--ll-ease-out), background-color var(--ll-duration-fast) var(--ll-ease-out), border-color var(--ll-duration-fast) var(--ll-ease-out), opacity var(--ll-duration-fast) var(--ll-ease-out);
}

.ui-modal__close:hover {
  color: var(--ll-color-ink);
  background: var(--ll-color-metal-025);
  border-color: var(--ll-color-divider);
}

.ui-modal__close:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.ui-modal__close svg { width: 1rem; height: 1rem; }

.ui-modal__body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--ll-space-4);
  padding: var(--ll-space-6);
}

.ui-modal__panel--has-close .ui-modal__body { padding-right: calc(var(--ll-space-6) + 2rem); }

.ui-modal__icon {
  display: grid;
  box-sizing: border-box;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--ll-color-brand-bright);
  background: transparent;
  border: 1px solid var(--ll-color-brand-bright);
  border-radius: var(--ll-radius-pill);
}

.ui-modal__icon :deep(svg) {
  width: 1.35rem;
  height: 1.35rem;
}

.ui-modal__content {
  min-width: 0;
  padding-top: 0.15rem;
}

.ui-modal__title {
  margin: 0;
  font: 600 1.15rem / 1.25 var(--ll-font-display);
  letter-spacing: -0.015em;
}

.ui-modal__description,
.ui-modal__detail {
  margin: var(--ll-space-2) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.55;
}

.ui-modal__description { font-size: 0.9375rem; }

.ui-modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
  padding: var(--ll-space-4) var(--ui-modal-action-inset) var(--ui-modal-action-inset);
  background: var(--ll-color-metal-025);
  border-top: 1px solid var(--ll-color-divider);
}

.ui-modal__actions :deep(.ui-button) {
  --ui-button-height: var(--ui-modal-action-height);

  font-weight: 600;
}

.ui-modal__actions :deep(.ui-button--primary),
.ui-modal__actions :deep(.ui-button--coral) {
  color: var(--ll-color-metal-025);
}

@media (hover: hover) and (pointer: fine) {
  .ui-modal__close { opacity: 0; }
  .ui-modal__close:hover,
  .ui-modal__close:focus-visible { opacity: 1; }
}

.ui-modal-enter-active,
.ui-modal-leave-active {
  transition: opacity 160ms ease;
}

.ui-modal-enter-active .ui-modal__panel,
.ui-modal-leave-active .ui-modal__panel {
  transition: opacity 160ms ease, transform 180ms var(--ll-ease-out);
}

.ui-modal-enter-from,
.ui-modal-leave-to {
  opacity: 0;
}

.ui-modal-enter-from .ui-modal__panel,
.ui-modal-leave-to .ui-modal__panel {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.985);
}

@media (max-width: 36rem) {
  .ui-modal {
    align-items: end;
    padding: var(--ll-space-3);
  }

  .ui-modal__body {
    grid-template-columns: 1fr;
    padding: var(--ll-space-5);
  }

  .ui-modal__panel--has-close .ui-modal__body { padding-right: calc(var(--ll-space-5) + 2rem); }

  .ui-modal__actions {
    display: grid;
  }

  .ui-modal__actions :deep(.ui-button) {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-modal,
  .ui-modal__panel {
    transition: none;
  }
}
</style>
