<script setup lang="ts">
interface NavigationItem {
  label: string
  description?: string
  to?: string
  href?: string
  mark?: string
}

interface NavigationSection {
  label: string
  items: NavigationItem[]
}

interface NavigationMenu {
  label: string
  sections: NavigationSection[]
}

interface NavigationLink {
  label: string
  to?: string
  href?: string
}

const props = withDefaults(defineProps<{
  menus: NavigationMenu[]
  links?: NavigationLink[]
  ariaLabel?: string
}>(), {
  links: () => [],
  ariaLabel: 'Main navigation',
})

const root = ref<HTMLElement | null>(null)
const activeMenu = ref<string | null>(null)
const mobileOpen = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | undefined

const selectedMenu = computed(() => props.menus.find(menu => menu.label === activeMenu.value))

function toggleMenu(label: string) {
  cancelScheduledClose()
  activeMenu.value = activeMenu.value === label ? null : label
}

function openMenu(label: string) {
  cancelScheduledClose()
  activeMenu.value = label
}

function cancelScheduledClose() {
  if (closeTimer === undefined) return
  clearTimeout(closeTimer)
  closeTimer = undefined
}

function scheduleClose(delay = 110) {
  cancelScheduledClose()
  closeTimer = setTimeout(() => {
    activeMenu.value = null
    closeTimer = undefined
  }, delay)
}

function closeMenus() {
  cancelScheduledClose()
  activeMenu.value = null
  mobileOpen.value = false
}

function linkComponent(link: NavigationLink | NavigationItem) {
  return link.to ? resolveComponent('NuxtLink') : 'a'
}

function linkBindings(link: NavigationLink | NavigationItem) {
  return link.to ? { to: link.to } : { href: link.href || '#' }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) closeMenus()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenus()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  cancelScheduledClose()
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <header
    ref="root"
    class="ui-main-navigation"
    :class="{ 'is-open': activeMenu || mobileOpen }"
    @pointerenter="cancelScheduledClose"
    @pointerleave="scheduleClose()"
  >
    <nav class="ui-main-navigation__bar" :aria-label="ariaLabel">
      <div
        class="ui-main-navigation__brand"
        @pointerenter="scheduleClose(40)"
        @focusin="scheduleClose(0)"
      ><slot name="brand" /></div>

      <div class="ui-main-navigation__desktop-links">
        <button
          v-for="menu in menus"
          :key="menu.label"
          type="button"
          class="ui-main-navigation__trigger"
          :class="{ 'is-active': activeMenu === menu.label }"
          :aria-expanded="activeMenu === menu.label"
          aria-haspopup="true"
          @pointerenter="openMenu(menu.label)"
          @focus="openMenu(menu.label)"
          @click="toggleMenu(menu.label)"
        >
          <span aria-hidden="true" />{{ menu.label }}
        </button>

        <component
          :is="linkComponent(link)"
          v-for="link in links"
          :key="link.label"
          v-bind="linkBindings(link)"
          class="ui-main-navigation__link"
          @pointerenter="scheduleClose(40)"
          @focus="scheduleClose(0)"
          @click="closeMenus"
        >
          {{ link.label }}
        </component>
      </div>

      <div
        class="ui-main-navigation__actions"
        @pointerenter="scheduleClose(40)"
        @focusin="scheduleClose(0)"
      ><slot name="actions" /></div>

      <button
        type="button"
        class="ui-main-navigation__mobile-toggle"
        :aria-expanded="mobileOpen"
        aria-label="Toggle navigation"
        @click="mobileOpen = !mobileOpen"
      >
        <span /><span />
      </button>
    </nav>

    <Transition name="ui-navigation-scrim">
      <button
        v-if="activeMenu"
        type="button"
        class="ui-main-navigation__scrim"
        aria-label="Close navigation"
        @pointerenter="scheduleClose()"
        @click="closeMenus"
      />
    </Transition>

    <Transition name="ui-navigation-dropdown">
      <div
        v-if="selectedMenu"
        class="ui-main-navigation__dropdown"
        @pointerenter="cancelScheduledClose"
      >
        <div class="ui-main-navigation__sections">
          <section
            v-for="section in selectedMenu.sections"
            :key="section.label"
            class="ui-main-navigation__section"
            :style="{ '--ui-navigation-section-weight': Math.max(section.items.length, 1) }"
          >
            <p>{{ section.label }}</p>
            <div class="ui-main-navigation__items">
              <component
                :is="linkComponent(item)"
                v-for="item in section.items"
                :key="item.label"
                v-bind="linkBindings(item)"
                class="ui-main-navigation__item"
                @click="closeMenus"
              >
                <span class="ui-main-navigation__item-copy">
                  <strong>{{ item.label }}</strong>
                  <small v-if="item.description">{{ item.description }}</small>
                </span>
                <span class="ui-main-navigation__item-mark" aria-hidden="true">{{ item.mark || '↗' }}</span>
              </component>
            </div>
          </section>
        </div>
      </div>
    </Transition>

    <Transition name="ui-navigation-dropdown">
      <div v-if="mobileOpen" class="ui-main-navigation__mobile-panel">
        <section v-for="menu in menus" :key="menu.label">
          <strong>{{ menu.label }}</strong>
          <template v-for="section in menu.sections" :key="section.label">
            <small>{{ section.label }}</small>
            <component
              :is="linkComponent(item)"
              v-for="item in section.items"
              :key="item.label"
              v-bind="linkBindings(item)"
              @click="closeMenus"
            >{{ item.label }}</component>
          </template>
        </section>
        <component
          :is="linkComponent(link)"
          v-for="link in links"
          :key="link.label"
          v-bind="linkBindings(link)"
          @click="closeMenus"
        >{{ link.label }}</component>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.ui-main-navigation {
  --ui-navigation-motion-ease: cubic-bezier(0.55, 0, 1, 0.45);
  --ui-navigation-surface: var(--ll-color-card);
  --ui-navigation-border: var(--ll-color-divider);
  --ui-navigation-dropdown-inset: 7%;
  --ui-navigation-shoulder: calc(var(--ll-radius-structural) + var(--ll-space-6));

  position: relative;
  z-index: 30;
  width: 100%;
  color: var(--ll-color-ink);
  font-family: var(--ll-font-control);
}

.ui-main-navigation__bar {
  position: relative;
  z-index: 3;
  display: grid;
  min-height: 4.25rem;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--ll-space-8);
  padding: 0 clamp(1.25rem, 4vw, 3.5rem);
  background: var(--ui-navigation-surface);
  border-bottom: 1px solid var(--ui-navigation-border);
}

.ui-main-navigation__brand {
  display: flex;
  align-items: center;
}

.ui-main-navigation__desktop-links,
.ui-main-navigation__actions {
  display: flex;
  align-items: center;
  gap: var(--ll-space-2);
}

.ui-main-navigation__actions {
  justify-content: flex-end;
}

.ui-main-navigation__trigger,
.ui-main-navigation__link {
  display: inline-flex;
  height: 1.75rem;
  align-items: center;
  padding: 0 0.75rem;
  color: var(--ll-color-text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--ll-radius-pill);
  font: 550 0.8125rem / 1.2 var(--ll-font-control);
  text-decoration: none;
  cursor: pointer;
  transition:
    color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-main-navigation__trigger > span {
  width: 0.375rem;
  height: 0.375rem;
  margin-right: var(--ll-space-2);
  background: currentColor;
  border-radius: 50%;
  opacity: 0.45;
  transition: opacity var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-main-navigation__trigger:hover,
.ui-main-navigation__trigger.is-active,
.ui-main-navigation__link:hover {
  color: var(--ll-color-ink);
  background: var(--ll-color-surface-muted);
}

.ui-main-navigation__trigger:hover > span,
.ui-main-navigation__trigger.is-active > span {
  opacity: 1;
}

.ui-main-navigation__trigger:focus-visible,
.ui-main-navigation__link:focus-visible,
.ui-main-navigation__item:focus-visible,
.ui-main-navigation__mobile-toggle:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.ui-main-navigation__scrim {
  position: absolute;
  z-index: 1;
  top: 100%;
  left: 0;
  width: 100%;
  height: min(42rem, 80vh);
  padding: 0;
  background: transparent;
  border: 0;
  cursor: default;
}

.ui-main-navigation__dropdown,
.ui-main-navigation__mobile-panel {
  position: absolute;
  z-index: 4;
  top: calc(100% - 1px);
  left: var(--ui-navigation-dropdown-inset);
  width: min(72rem, calc(100% - (var(--ui-navigation-dropdown-inset) * 2)));
  padding: var(--ll-space-5);
  background: var(--ui-navigation-surface);
  border: 1px solid var(--ui-navigation-border);
  border-top: 0;
  border-radius: 0 0 var(--ll-radius-structural) var(--ll-radius-structural);
  transform-origin: top center;
}

.ui-main-navigation__dropdown::before,
.ui-main-navigation__dropdown::after {
  position: absolute;
  top: 0;
  width: var(--ui-navigation-shoulder);
  height: var(--ui-navigation-shoulder);
  pointer-events: none;
  content: '';
}

.ui-main-navigation__dropdown::before {
  right: calc(100% - 1px);
  background-image: radial-gradient(
    ellipse calc(var(--ui-navigation-shoulder) - 1px) var(--ui-navigation-shoulder) at bottom left,
    var(--ll-color-canvas) calc(100% - 1px),
    var(--ui-navigation-border) calc(100% - 1px) 100%,
    var(--ui-navigation-surface) 100%
  );
}

.ui-main-navigation__dropdown::after {
  left: calc(100% - 1px);
  background-image: radial-gradient(
    ellipse calc(var(--ui-navigation-shoulder) - 1px) var(--ui-navigation-shoulder) at bottom right,
    var(--ll-color-canvas) calc(100% - 1px),
    var(--ui-navigation-border) calc(100% - 1px) 100%,
    var(--ui-navigation-surface) 100%
  );
}

.ui-main-navigation__sections {
  display: flex;
  gap: var(--ll-space-4);
}

.ui-main-navigation__section {
  display: grid;
  min-width: 13rem;
  flex: var(--ui-navigation-section-weight) 1 0;
  grid-template-rows: auto 1fr;
  align-content: start;
  gap: var(--ll-space-4);
}

.ui-main-navigation__section > p {
  margin: 0;
  padding: var(--ll-space-3) var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-highlight);
  border-radius: var(--ll-radius-pill);
  font: 550 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ui-main-navigation__items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  overflow: hidden;
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-lg);
}

.ui-main-navigation__item {
  position: relative;
  display: flex;
  min-height: 9.5rem;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-5);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border-right: 1px solid var(--ll-color-divider);
  text-decoration: none;
  transition: background var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-main-navigation__item:last-child {
  border-right: 0;
}

.ui-main-navigation__item:hover {
  background: var(--ll-color-highlight);
}

.ui-main-navigation__item-copy {
  display: grid;
  gap: var(--ll-space-2);
}

.ui-main-navigation__item-copy strong {
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ui-main-navigation__item-copy small {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.4;
}

.ui-main-navigation__item-mark {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  align-self: flex-end;
  color: var(--ll-color-primary);
  background: linear-gradient(145deg, #ffffff, var(--ll-color-blue-100));
  border: 1px solid var(--ll-color-border-strong);
  border-radius: 50%;
  box-shadow: var(--ll-shadow-raised);
  font: 600 var(--ll-text-lg) / 1 var(--ll-font-mono);
}

.ui-main-navigation__mobile-toggle,
.ui-main-navigation__mobile-panel {
  display: none;
}

.ui-navigation-dropdown-enter-active,
.ui-navigation-dropdown-leave-active {
  transition:
    opacity 180ms var(--ui-navigation-motion-ease),
    transform 240ms var(--ui-navigation-motion-ease),
    border-radius 240ms var(--ui-navigation-motion-ease);
}

.ui-navigation-dropdown-enter-from,
.ui-navigation-dropdown-leave-to {
  opacity: 0;
  border-radius: 0 0 var(--ll-radius-sm) var(--ll-radius-sm);
  transform: translateY(-0.75rem) scaleY(0.96);
}

.ui-navigation-scrim-enter-active,
.ui-navigation-scrim-leave-active {
  transition: opacity 180ms var(--ui-navigation-motion-ease);
}

.ui-navigation-scrim-enter-from,
.ui-navigation-scrim-leave-to {
  opacity: 0;
}

@media (max-width: 64rem) {
  .ui-main-navigation__bar {
    grid-template-columns: 1fr auto;
  }

  .ui-main-navigation__desktop-links,
  .ui-main-navigation__actions {
    display: none;
  }

  .ui-main-navigation__mobile-toggle {
    display: grid;
    width: 2.5rem;
    height: 2.5rem;
    place-content: center;
    gap: 0.375rem;
    padding: 0;
    background: var(--ll-color-surface-raised);
    border: 1px solid var(--ll-color-border);
    border-radius: 50%;
  }

  .ui-main-navigation__mobile-toggle span {
    width: 1rem;
    height: 1px;
    background: var(--ll-color-ink);
  }

  .ui-main-navigation__mobile-panel {
    display: grid;
    left: var(--ll-space-4);
    width: calc(100% - (var(--ll-space-4) * 2));
    max-height: min(38rem, calc(100vh - 6rem));
    gap: var(--ll-space-5);
    overflow-y: auto;
    border-radius: 0 0 var(--ll-radius-structural) var(--ll-radius-structural);
  }

  .ui-main-navigation__mobile-panel::before,
  .ui-main-navigation__mobile-panel::after {
    content: none;
  }

  .ui-main-navigation__mobile-panel section {
    display: grid;
    gap: var(--ll-space-2);
  }

  .ui-main-navigation__mobile-panel section > strong,
  .ui-main-navigation__mobile-panel section > small {
    padding-inline: var(--ll-space-3);
  }

  .ui-main-navigation__mobile-panel section > small {
    margin-top: var(--ll-space-3);
    color: var(--ll-color-text-faint);
    font-family: var(--ll-font-mono);
    text-transform: uppercase;
  }

  .ui-main-navigation__mobile-panel a {
    padding: var(--ll-space-3);
    color: var(--ll-color-ink);
    background: var(--ll-color-surface-muted);
    border-radius: var(--ll-radius-md);
    text-decoration: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-navigation-dropdown-enter-active,
  .ui-navigation-dropdown-leave-active,
  .ui-navigation-scrim-enter-active,
  .ui-navigation-scrim-leave-active {
    transition: none;
  }
}
</style>
