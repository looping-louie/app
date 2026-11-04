<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  titleVariant?: 'default' | 'eyebrow'
  side?: 'left' | 'right'
  size?: 'default' | 'wide'
  closeOnBackdrop?: boolean
  showClose?: boolean
}>(), {
  description: undefined,
  titleVariant: 'default',
  side: 'right',
  size: 'default',
  closeOnBackdrop: true,
  showClose: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const panel = ref<HTMLElement | null>(null)
const titleId = `ui-drawer-title-${useId().replaceAll(':', '')}`
const descriptionId = `ui-drawer-description-${useId().replaceAll(':', '')}`
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
    ;(preferred || focusableElements()[0] || panel.value)?.focus()
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
    <Transition :name="`ui-drawer-${side}`">
      <div v-if="open" class="ui-drawer" :class="`ui-drawer--${side}`" @mousedown="onBackdropClick">
        <section
          ref="panel"
          class="ui-drawer__panel"
          :class="[`ui-drawer__panel--${size}`, `ui-drawer__panel--${side}`]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @keydown="onKeydown"
          @mousedown.stop
        >
          <header class="ui-drawer__header" :class="{ 'ui-drawer__header--eyebrow': titleVariant === 'eyebrow' }">
            <div class="ui-drawer__heading" :class="{ 'ui-drawer__heading--eyebrow': titleVariant === 'eyebrow' }">
              <h2 :id="titleId">{{ title }}</h2>
              <p v-if="description" :id="descriptionId">{{ description }}</p>
            </div>
            <div class="ui-drawer__actions">
              <slot name="actions" />
              <UiButton v-if="showClose" variant="stroke" size="sm" icon-only aria-label="Close drawer" title="Close drawer" @click="close">
                <template #leading>
                  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                  </svg>
                </template>
              </UiButton>
            </div>
          </header>

          <div class="ui-drawer__body"><slot :close="close" /></div>

          <footer v-if="$slots.footer" class="ui-drawer__footer">
            <slot name="footer" :close="close" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-drawer {
  position: fixed;
  z-index: 1040;
  inset: 0;
  display: flex;
  background: color-mix(in srgb, var(--ll-color-ink) 34%, transparent);
}

.ui-drawer--right { justify-content: flex-end; }
.ui-drawer--left { justify-content: flex-start; }

.ui-drawer__panel {
  display: grid;
  width: min(100%, 32rem);
  height: 100%;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  color: var(--ll-color-ink);
  background: var(--ll-color-metal-025);
  border-color: var(--ll-color-divider);
  box-shadow: 0 0 3.5rem color-mix(in srgb, var(--ll-color-ink) 18%, transparent);
  outline: none;
}

.ui-drawer__panel--wide { width: min(100%, 42rem); }
.ui-drawer__panel--right { border-left: 1px solid var(--ll-color-divider); border-radius: 0; }
.ui-drawer__panel--left { border-right: 1px solid var(--ll-color-divider); border-radius: 0 var(--ll-radius-modal) var(--ll-radius-modal) 0; }

.ui-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-5);
  padding: var(--ll-space-6);
  background: var(--ll-color-metal-025);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ui-drawer__heading { min-width: 0; }
.ui-drawer__heading h2 { margin: 0; font: 600 1.15rem / 1.25 var(--ll-font-display); letter-spacing: -0.015em; }
.ui-drawer__heading p { margin: var(--ll-space-2) 0 0; color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.5 var(--ll-font-control); }
.ui-drawer__header--eyebrow { position: relative; display: block; padding-inline: calc(var(--ll-space-6) + 2.125rem); }
.ui-drawer__heading--eyebrow { text-align: center; }
.ui-drawer__heading--eyebrow h2 { color: var(--ll-color-primary); font: 600 var(--ll-text-xs) / 1 var(--ll-font-control); text-transform: uppercase; letter-spacing: 0.08em; }
.ui-drawer__heading--eyebrow p { margin-top: var(--ll-space-3); }
.ui-drawer__actions { display: flex; flex: none; align-items: center; gap: var(--ll-space-2); }
.ui-drawer__header--eyebrow .ui-drawer__actions { position: absolute; top: var(--ll-space-6); right: var(--ll-space-6); }

.ui-drawer__body { min-height: 0; overflow-y: auto; padding: var(--ll-space-6); background: var(--ll-color-metal-025); }
.ui-drawer__footer { padding: var(--ll-space-4) var(--ll-space-6) var(--ll-space-6); background: var(--ll-color-metal-025); border-top: 1px solid var(--ll-color-divider); }
.ui-drawer__footer :deep(.ui-button) { width: 100%; }

.ui-drawer-right-enter-active,
.ui-drawer-right-leave-active,
.ui-drawer-left-enter-active,
.ui-drawer-left-leave-active { transition: opacity 200ms ease; }
.ui-drawer-right-enter-active .ui-drawer__panel,
.ui-drawer-right-leave-active .ui-drawer__panel,
.ui-drawer-left-enter-active .ui-drawer__panel,
.ui-drawer-left-leave-active .ui-drawer__panel { transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1); }
.ui-drawer-right-enter-from,
.ui-drawer-right-leave-to,
.ui-drawer-left-enter-from,
.ui-drawer-left-leave-to { opacity: 0; }
.ui-drawer-right-enter-from .ui-drawer__panel,
.ui-drawer-right-leave-to .ui-drawer__panel { transform: translateX(100%); }
.ui-drawer-left-enter-from .ui-drawer__panel,
.ui-drawer-left-leave-to .ui-drawer__panel { transform: translateX(-100%); }

@media (max-width: 36rem) {
  .ui-drawer__panel { width: 100%; border-radius: 0; }
  .ui-drawer__header, .ui-drawer__body { padding: var(--ll-space-5); }
  .ui-drawer__header--eyebrow { padding-inline: calc(var(--ll-space-5) + 2.125rem); }
  .ui-drawer__header--eyebrow .ui-drawer__actions { top: var(--ll-space-5); right: var(--ll-space-5); }
  .ui-drawer__footer { padding: var(--ll-space-4) var(--ll-space-5) var(--ll-space-5); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-drawer, .ui-drawer__panel { transition: none; }
}
</style>
