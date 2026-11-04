<script setup lang="ts">
interface CommandPaletteItem {
  id: string
  label: string
  description?: string
  group?: string
  keywords?: string[]
  iconPath?: string
  imageSrc?: string
  imageAlt?: string
  shortcut?: string
  disabled?: boolean
}

type CommandPaletteSize = 'default' | 'wide'
type CommandPaletteOptionStyle = 'accent' | 'card'

const props = withDefaults(defineProps<{
  open: boolean
  items: CommandPaletteItem[]
  placeholder?: string
  ariaLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  closeOnBackdrop?: boolean
  closeOnSelect?: boolean
  keyboardShortcut?: boolean
  size?: CommandPaletteSize
  optionStyle?: CommandPaletteOptionStyle
}>(), {
  placeholder: 'Search commands…',
  ariaLabel: 'Command palette',
  emptyTitle: 'No results found',
  emptyDescription: 'Try another command or search term.',
  closeOnBackdrop: true,
  closeOnSelect: true,
  keyboardShortcut: true,
  size: 'default',
  optionStyle: 'accent',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [item: CommandPaletteItem]
}>()

const query = defineModel<string>('query', { default: '' })
const panel = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const paletteId = `ui-command-palette-${useId().replaceAll(':', '')}`
const listboxId = `${paletteId}-results`
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

const filteredItems = computed(() => {
  const term = query.value.trim().toLocaleLowerCase()
  if (!term) return props.items

  return props.items.filter((item) => (
    [item.label, item.description, item.group, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(term)
  ))
})

const groupedItems = computed(() => {
  const groups = new Map<string, CommandPaletteItem[]>()
  for (const item of filteredItems.value) {
    const group = item.group || 'Commands'
    groups.set(group, [...(groups.get(group) ?? []), item])
  }
  return [...groups].map(([label, items]) => ({ label, items }))
})

const activeItem = computed(() => filteredItems.value[activeIndex.value])

function optionId(item: CommandPaletteItem) {
  return `${paletteId}-option-${props.items.indexOf(item)}`
}

function close() {
  emit('update:open', false)
}

function select(item: CommandPaletteItem) {
  if (item.disabled) return
  emit('select', item)
  if (props.closeOnSelect) close()
}

function moveActive(direction: 1 | -1) {
  const items = filteredItems.value
  if (!items.length) return

  let next = activeIndex.value
  for (let count = 0; count < items.length; count += 1) {
    next = (next + direction + items.length) % items.length
    if (!items[next]?.disabled) {
      activeIndex.value = next
      nextTick(() => document.getElementById(optionId(items[next]!))?.scrollIntoView({ block: 'nearest' }))
      return
    }
  }
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    activeIndex.value = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    activeIndex.value = Math.max(0, filteredItems.value.length - 1)
  } else if (event.key === 'Enter' && activeItem.value) {
    event.preventDefault()
    select(activeItem.value)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function onPanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return

  const focusable = [...(panel.value?.querySelectorAll<HTMLElement>('input, button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])') ?? [])]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function onBackdropMouseDown(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) close()
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (!props.keyboardShortcut || event.key.toLocaleLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) return
  event.preventDefault()
  emit('update:open', !props.open)
}

watch(filteredItems, (items) => {
  const firstAvailable = items.findIndex(item => !item.disabled)
  activeIndex.value = Math.max(0, firstAvailable)
})

watch(() => props.open, async (open) => {
  if (!import.meta.client) return
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    activeIndex.value = Math.max(0, filteredItems.value.findIndex(item => !item.disabled))
    await nextTick()
    input.value?.focus()
  } else {
    document.body.style.overflow = previousOverflow
    previousFocus?.focus()
    previousFocus = null
  }
})

onMounted(() => document.addEventListener('keydown', onGlobalKeydown))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
  if (import.meta.client) document.body.style.overflow = previousOverflow
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-command-palette">
      <div v-if="open" class="ui-command-palette" @mousedown="onBackdropMouseDown">
        <section
          ref="panel"
          class="ui-command-palette__panel"
          :class="[
            `ui-command-palette__panel--${size}`,
            `ui-command-palette__panel--options-${optionStyle}`,
          ]"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          @keydown="onPanelKeydown"
          @mousedown.stop
        >
          <div class="ui-command-palette__search">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M229.66,218.34l-50.07-50.06a88.1,88.1,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
            </svg>
            <input
              ref="input"
              v-model="query"
              type="search"
              role="combobox"
              autocomplete="off"
              :placeholder="placeholder"
              :aria-label="placeholder"
              :aria-controls="listboxId"
              :aria-expanded="open"
              aria-autocomplete="list"
              :aria-activedescendant="activeItem ? optionId(activeItem) : undefined"
              @keydown="onInputKeydown"
            >
            <kbd>Esc</kbd>
          </div>

          <div :id="listboxId" class="ui-command-palette__results" role="listbox">
            <template v-if="filteredItems.length">
              <section v-for="group in groupedItems" :key="group.label" class="ui-command-palette__group" role="group" :aria-label="group.label">
                <h2>{{ group.label }}</h2>
                <button
                  v-for="item in group.items"
                  :id="optionId(item)"
                  :key="item.id"
                  type="button"
                  class="ui-command-palette__option"
                  :class="{ 'is-active': activeItem?.id === item.id }"
                  role="option"
                  :aria-selected="activeItem?.id === item.id"
                  :disabled="item.disabled"
                  @mouseenter="activeIndex = filteredItems.indexOf(item)"
                  @focus="activeIndex = filteredItems.indexOf(item)"
                  @click="select(item)"
                >
                  <slot name="item" :item="item" :active="activeItem?.id === item.id">
                    <span class="ui-command-palette__media" aria-hidden="true">
                      <img v-if="item.imageSrc" :src="item.imageSrc" :alt="item.imageAlt || ''">
                      <svg v-else viewBox="0 0 256 256" fill="currentColor">
                        <path :d="item.iconPath || 'M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200Z'" />
                      </svg>
                    </span>
                    <span class="ui-command-palette__copy">
                      <strong>{{ item.label }}</strong>
                      <span v-if="item.description">{{ item.description }}</span>
                    </span>
                    <kbd v-if="item.shortcut">{{ item.shortcut }}</kbd>
                    <svg v-else class="ui-command-palette__enter" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                      <path d="M200,40V88a32,32,0,0,1-32,32H67.31l34.35-34.34A8,8,0,0,0,90.34,74.34l-48,48a8,8,0,0,0,0,11.32l48,48a8,8,0,0,0,11.32-11.32L67.31,136H168a48.05,48.05,0,0,0,48-48V40a8,8,0,0,0-16,0Z" />
                    </svg>
                  </slot>
                </button>
              </section>
            </template>

            <div v-else class="ui-command-palette__empty">
              <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M229.66,218.34l-50.07-50.06a88.1,88.1,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
              </svg>
              <strong>{{ emptyTitle }}</strong>
              <span>{{ emptyDescription }}</span>
            </div>
          </div>

          <footer class="ui-command-palette__footer" aria-label="Keyboard instructions">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-command-palette {
  position: fixed;
  z-index: 1100;
  inset: 0;
  display: grid;
  box-sizing: border-box;
  align-items: start;
  justify-items: center;
  padding: clamp(4rem, 14vh, 8rem) var(--ll-space-4) var(--ll-space-4);
  background: color-mix(in srgb, var(--ll-color-ink) 48%, transparent);
  backdrop-filter: blur(0.25rem);
}

.ui-command-palette__panel {
  width: min(100%, 38rem);
  overflow: hidden;
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-modal);
  box-shadow: 0 1.5rem 4rem color-mix(in srgb, var(--ll-color-ink) 26%, transparent);
  outline: none;
}

.ui-command-palette__panel--wide {
  width: min(100%, 72rem);
}

.ui-command-palette__search {
  display: flex;
  min-height: 4.75rem;
  align-items: center;
  gap: var(--ll-space-3);
  padding-inline: var(--ll-space-6);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ui-command-palette__search > svg {
  width: 1.35rem;
  height: 1.35rem;
  flex: none;
  color: var(--ll-color-primary);
}

.ui-command-palette__search input {
  min-width: 0;
  flex: 1;
  padding: var(--ll-space-5) 0;
  color: var(--ll-color-ink);
  background: transparent;
  border: 0;
  outline: 0;
  font: 500 1.05rem / 1.35 var(--ll-font-control);
}

.ui-command-palette__search input::placeholder { color: var(--ll-color-text-muted); }
.ui-command-palette__search input::-webkit-search-cancel-button { display: none; }

.ui-command-palette kbd {
  display: inline-grid;
  min-width: 1.5rem;
  height: 1.5rem;
  box-sizing: border-box;
  place-items: center;
  padding-inline: 0.35rem;
  color: var(--ll-color-text-muted);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-sm);
  box-shadow: 0 1px 0 var(--ll-color-metal-400);
  font: 600 0.6875rem / 1 var(--ll-font-mono);
}

.ui-command-palette__results {
  max-height: min(25rem, 56vh);
  overflow-y: auto;
  padding: var(--ll-space-3);
  scroll-padding-block: var(--ll-space-3);
}

.ui-command-palette__group + .ui-command-palette__group { margin-top: var(--ll-space-3); }

.ui-command-palette__group h2 {
  margin: 0;
  padding: var(--ll-space-2) var(--ll-space-3);
  color: var(--ll-color-text-faint);
  font: 600 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ui-command-palette__option {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3);
  color: var(--ll-color-ink);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ll-radius-lg);
  text-align: left;
  cursor: pointer;
  transition: color var(--ll-duration-fast) var(--ll-ease-out), background-color var(--ll-duration-fast) var(--ll-ease-out), border-color var(--ll-duration-fast) var(--ll-ease-out);
}

.ui-command-palette__option.is-active {
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-primary-highlight);
  border-color: var(--ll-color-primary);
}

.ui-command-palette__panel--options-card .ui-command-palette__option.is-active {
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.ui-command-palette__panel--options-card .ui-command-palette__option.is-active .ui-command-palette__media {
  border-color: var(--ll-color-divider);
}

.ui-command-palette__option:focus { outline: none; }
.ui-command-palette__option:focus-visible { box-shadow: inset 0 0 0 2px var(--ll-color-primary); }
.ui-command-palette__option:disabled { cursor: not-allowed; opacity: 0.48; }

.ui-command-palette__media {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  box-sizing: border-box;
  place-items: center;
  overflow: hidden;
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: 50%;
}

.ui-command-palette__media img { width: 100%; height: 100%; object-fit: cover; }
.ui-command-palette__media svg { width: 1.15rem; height: 1.15rem; }
.ui-command-palette__option.is-active .ui-command-palette__media { border-color: var(--ll-color-primary); }

.ui-command-palette__copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 0.2rem;
}

.ui-command-palette__copy strong {
  overflow: hidden;
  font: 600 var(--ll-text-sm) / 1.25 var(--ll-font-control);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-command-palette__copy > span {
  overflow: hidden;
  color: var(--ll-color-text-muted);
  font: 400 var(--ll-text-xs) / 1.35 var(--ll-font-control);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-command-palette__enter {
  width: 1rem;
  height: 1rem;
  flex: none;
  color: var(--ll-color-text-muted);
  opacity: 0;
  transition: opacity var(--ll-duration-fast) var(--ll-ease-out);
}

.ui-command-palette__option.is-active .ui-command-palette__enter { opacity: 1; }

.ui-command-palette__empty {
  display: grid;
  min-height: 15rem;
  place-content: center;
  justify-items: center;
  gap: var(--ll-space-2);
  padding: var(--ll-space-8);
  text-align: center;
}

.ui-command-palette__empty svg { width: 2rem; height: 2rem; color: var(--ll-color-text-muted); }
.ui-command-palette__empty strong { font: 600 var(--ll-text-md) / 1.25 var(--ll-font-display); }
.ui-command-palette__empty span { color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }

.ui-command-palette__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-5);
  padding: var(--ll-space-3) var(--ll-space-6);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-metal-025);
  border-top: 1px solid var(--ll-color-divider);
  font-size: var(--ll-text-xs);
}

.ui-command-palette__footer span { display: inline-flex; align-items: center; gap: var(--ll-space-2); }
.ui-command-palette__footer kbd + kbd { margin-left: calc(var(--ll-space-2) * -1); }

.ui-command-palette-enter-active,
.ui-command-palette-leave-active { transition: opacity 160ms ease; }

.ui-command-palette-enter-active .ui-command-palette__panel,
.ui-command-palette-leave-active .ui-command-palette__panel { transition: opacity 160ms ease, transform 180ms var(--ll-ease-out); }

.ui-command-palette-enter-from,
.ui-command-palette-leave-to { opacity: 0; }

.ui-command-palette-enter-from .ui-command-palette__panel,
.ui-command-palette-leave-to .ui-command-palette__panel { opacity: 0; transform: translateY(-0.5rem) scale(0.985); }

@media (max-width: 36rem) {
  .ui-command-palette { padding: var(--ll-space-3); }
  .ui-command-palette__panel { align-self: start; }
  .ui-command-palette__search { min-height: 4rem; padding-inline: var(--ll-space-5); }
  .ui-command-palette__option { border-radius: var(--ll-radius-md); }
  .ui-command-palette__footer { gap: var(--ll-space-3); padding-inline: var(--ll-space-5); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-command-palette,
  .ui-command-palette__panel,
  .ui-command-palette__option,
  .ui-command-palette__enter { transition: none; }
}
</style>
