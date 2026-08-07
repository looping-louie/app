<template>
  <div class="app-shell">
    <aside ref="sidebarRef" class="sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-header">
        <NuxtLink to="/app" class="sidebar-logo" aria-label="Looping Louie home" @click="closeMobile">
          <img class="logo-icon" src="/brand/twemoji-small-airplane.svg" alt="" width="30" height="30">
        </NuxtLink>
        <button class="sidebar-close" aria-label="Cerrar menú" @click="closeMobile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Navegación principal" @scroll="hideNavTooltip">
        <template v-for="(group, groupIndex) in navGroups" :key="groupIndex">
          <div v-if="groupIndex > 0" class="nav-divider" />
          <NuxtLink
            v-for="item in group"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item.to) }"
            :aria-label="item.label"
            @mouseenter="showNavTooltip(item.label, $event)"
            @mouseleave="hideNavTooltip"
            @focus="showNavTooltip(item.label, $event)"
            @blur="hideNavTooltip"
            @click="closeMobile"
          >
            <span class="nav-icon" v-html="item.icon" />
          </NuxtLink>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="user-avatar" title="Usuario" aria-label="Usuario">U</div>
      </div>
    </aside>

    <div class="sidebar-backdrop" :class="{ visible: mobileOpen }" @click="closeMobile" />

    <Teleport to="body">
      <Transition name="nav-tooltip">
        <div
          v-if="navTooltip.visible"
          class="nav-tooltip"
          :class="{ 'nav-tooltip--active': navTooltip.active }"
          :style="navTooltipStyle"
          role="tooltip"
        >
          {{ navTooltip.label }}
        </div>
      </Transition>
    </Teleport>

    <div class="app-body">
      <header class="app-topbar">
        <button class="menu-toggle" aria-label="Abrir menú" @click="openMobile">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75ZM2.75 14a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75Z"/></svg>
        </button>
        <span class="topbar-title">{{ currentLabel }}</span>
      </header>

      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const mobileOpen = ref(false)
const sidebarRef = ref<HTMLElement | null>(null)
const navTooltip = reactive({
  visible: false,
  active: false,
  label: '',
  top: 0,
  left: 0,
  height: 0,
})
const navTooltipStyle = computed(() => ({
  top: `${navTooltip.top}px`,
  left: `${navTooltip.left}px`,
  height: `${navTooltip.height}px`,
}))

function showNavTooltip(label: string, event: MouseEvent | FocusEvent) {
  const item = event.currentTarget
  const sidebar = sidebarRef.value
  if (!(item instanceof HTMLElement) || !sidebar) return

  const itemBounds = item.getBoundingClientRect()
  const sidebarBounds = sidebar.getBoundingClientRect()
  const mirroredGap = Math.max(0, sidebarBounds.right - itemBounds.right)

  navTooltip.label = label
  navTooltip.active = item.classList.contains('active')
  navTooltip.top = itemBounds.top
  navTooltip.left = sidebarBounds.right + mirroredGap
  navTooltip.height = itemBounds.height
  navTooltip.visible = true
}

function hideNavTooltip() {
  navTooltip.visible = false
}

function phosphorIcon(path: string) {
  return `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`
}

// Phosphor Icons · regular weight
const iconRuns = phosphorIcon('M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z')
const iconObservability = phosphorIcon('M240,128a8,8,0,0,1-8,8H204.94l-37.78,75.58A8,8,0,0,1,160,216h-.4a8,8,0,0,1-7.08-5.14L95.35,60.76,63.28,131.31A8,8,0,0,1,56,136H24a8,8,0,0,1,0-16H50.85L88.72,36.69a8,8,0,0,1,14.76.46l57.51,151,31.85-63.71A8,8,0,0,1,200,120h32A8,8,0,0,1,240,128Z')
const iconHumanGates = phosphorIcon('M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z')
const iconPipelines = phosphorIcon('M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128c0-.74,0-1.48-.08-2.21l13.23-4.41A32,32,0,1,0,168,104c0,.74,0,1.48.08,2.21l-13.23,4.41A32,32,0,0,0,128,96a32.59,32.59,0,0,0-5.27.44L115.89,81A32,32,0,1,0,96,88a32.59,32.59,0,0,0,5.27-.44l6.84,15.4a31.92,31.92,0,0,0-8.57,39.64L73.83,165.44a32.06,32.06,0,1,0,10.63,12l25.71-22.84a31.91,31.91,0,0,0,37.36-1.24l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32Zm0-64a16,16,0,1,1-16,16A16,16,0,0,1,200,88ZM80,56A16,16,0,1,1,96,72,16,16,0,0,1,80,56ZM56,208a16,16,0,1,1,16-16A16,16,0,0,1,56,208Zm56-80a16,16,0,1,1,16,16A16,16,0,0,1,112,128Zm88,72a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z')
const iconLoops = phosphorIcon('M253.93,154.63c-1.32-1.46-24.09-26.22-61-40.56-1.72-18.42-8.46-35.17-19.41-47.92C158.87,49,137.58,40,112,40,60.48,40,26.89,86.18,25.49,88.15a8,8,0,0,0,13,9.31C38.8,97.05,68.81,56,112,56c20.77,0,37.86,7.11,49.41,20.57,7.42,8.64,12.44,19.69,14.67,32A140.87,140.87,0,0,0,140.6,104c-26.06,0-47.93,6.81-63.26,19.69C63.78,135.09,56,151,56,167.25A47.59,47.59,0,0,0,69.87,201.3c9.66,9.62,23.06,14.7,38.73,14.7,51.81,0,81.18-42.13,84.49-84.42a161.43,161.43,0,0,1,49,33.79,8,8,0,1,0,11.86-10.74Zm-94.46,21.64C150.64,187.09,134.66,200,108.6,200,83.32,200,72,183.55,72,167.25,72,144.49,93.47,120,140.6,120a124.34,124.34,0,0,1,36.78,5.68C176.93,144.44,170.46,162.78,159.47,176.27Z')
const iconAgents = phosphorIcon('M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-24,16v24H116V152ZM80,164a12,12,0,0,1,12-12h8v24H92A12,12,0,0,1,80,164Zm84,12h-8V152h8a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z')
const iconSkills = phosphorIcon('M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z')
const iconSettings = phosphorIcon('M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A112.1,112.1,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.62a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21Zm-15,34.91-28.57,16.25a8,8,0,0,0-3,3c-.58,1-1.19,2.06-1.81,3.06a7.94,7.94,0,0,0-1.22,4.21l-.15,32.25a95.89,95.89,0,0,1-25.37,14.3L134,199.13a8,8,0,0,0-3.91-1h-.19c-1.21,0-2.43,0-3.64,0a8.08,8.08,0,0,0-4.1,1l-28.84,16.1A96,96,0,0,1,67.88,201l-.11-32.2a8,8,0,0,0-1.22-4.22c-.62-1-1.23-2-1.8-3.06a8.09,8.09,0,0,0-3-3.06l-28.6-16.29a90.49,90.49,0,0,1,0-28.26L61.67,97.63a8,8,0,0,0,3-3c.58-1,1.19-2.06,1.81-3.06a7.94,7.94,0,0,0,1.22-4.21l.15-32.25a95.89,95.89,0,0,1,25.37-14.3L122,56.87a8,8,0,0,0,4.1,1c1.21,0,2.43,0,3.64,0a8.08,8.08,0,0,0,4.1-1l28.84-16.1A96,96,0,0,1,188.12,55l.11,32.2a8,8,0,0,0,1.22,4.22c.62,1,1.23,2,1.8,3.06a8.09,8.09,0,0,0,3,3.06l28.6,16.29A90.49,90.49,0,0,1,222.9,142.12Z')

const navGroups = [
  [
    { to: '/app/runs', label: 'Runs', icon: iconRuns }
  ],
  [
    { to: '/app/observability', label: 'Observability', icon: iconObservability },
    { to: '/app/human-intervention', label: 'Human gates', icon: iconHumanGates }
  ],
  [
    { to: '/app/pipelines', label: 'Pipelines', icon: iconPipelines },
    { to: '/app/loops', label: 'Loops', icon: iconLoops },
    { to: '/app/personas', label: 'Agents', icon: iconAgents },
    { to: '/app/skills', label: 'Skills', icon: iconSkills }
  ],
  [
    { to: '/app/settings', label: 'Settings', icon: iconSettings }
  ]
]

const navItems = computed(() => navGroups.flat())

const currentLabel = computed(() => {
  const match = navItems.value.find((item) => isActive(item.to))
  return match ? match.label : 'Dashboard'
})

function isActive(to: string) {
  if (to === '/app') {
    return route.path === '/app'
  }
  return route.path === to || route.path.startsWith(to + '/')
}

function openMobile() {
  mobileOpen.value = true
}

function closeMobile() {
  hideNavTooltip()
  mobileOpen.value = false
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  color: var(--ll-color-text);
  background: var(--ll-color-canvas);
}

.sidebar {
  width: 64px;
  flex-shrink: 0;
  background: var(--ll-color-surface-raised);
  border-right: 1px solid var(--ll-color-divider);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 200;
  transition: transform 0.25s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem 0 1.25rem;
  position: relative;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  background: transparent;
  text-decoration: none;
  font-weight: 700;
  box-shadow: none;
}

.logo-icon {
  width: 1.875rem;
  height: 1.875rem;
  object-fit: contain;
}

.sidebar-close {
  display: none;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: var(--ll-color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  align-items: center;
  justify-content: center;
}

.sidebar-close:hover {
  color: var(--ll-color-ink);
  background: var(--ll-color-highlight);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0 0.5rem;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-divider {
  height: 1px;
  width: 60%;
  margin: 0.5rem auto;
  background: var(--ll-color-divider);
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  border-radius: 0.625rem;
  color: var(--ll-color-text-muted);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
  position: relative;
  flex-shrink: 0;
}

.nav-item:hover {
  color: var(--ll-color-ink);
  background: var(--ll-color-highlight);
}

.nav-item:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.nav-item.active {
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-blue-100);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.nav-tooltip {
  position: fixed;
  z-index: 310;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding-inline: var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-highlight);
  border-radius: 0.625rem;
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-control);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--ll-shadow-raised);
}

.nav-tooltip--active {
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-blue-100);
}

.nav-tooltip-enter-active,
.nav-tooltip-leave-active {
  transition:
    opacity var(--ll-duration-normal) var(--ll-ease-out),
    transform var(--ll-duration-normal) var(--ll-ease-out);
}

.nav-tooltip-enter-from,
.nav-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-0.25rem);
}

.sidebar-footer {
  padding-top: 0.75rem;
  border-top: 1px solid var(--ll-color-divider);
  width: 100%;
  display: flex;
  justify-content: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--ll-color-surface-muted);
  border: 1px solid var(--ll-color-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ll-color-text-muted);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.user-avatar:hover {
  border-color: var(--ll-color-primary);
  color: var(--ll-color-ink);
}

.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(41, 47, 51, 0.34);
  z-index: 150;
  opacity: 0;
  transition: opacity 0.25s;
}

.sidebar-backdrop.visible {
  display: block;
  opacity: 1;
}

.app-body {
  flex: 1;
  margin-left: 64px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0;
}

.app-topbar {
  display: none;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(250, 251, 252, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ll-color-divider);
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--ll-color-divider);
  border-radius: 0.5rem;
  color: var(--ll-color-ink);
  cursor: pointer;
  padding: 0.4rem;
  transition: border-color 0.2s, background 0.2s;
}

.menu-toggle:hover {
  border-color: var(--ll-color-primary);
  background: var(--ll-color-highlight);
}

.topbar-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--ll-color-ink);
}

.app-content {
  flex: 1;
  padding: 0;
  position: relative;
  z-index: 2;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: flex;
  }

  .app-body {
    margin-left: 0;
  }

  .app-topbar {
    display: flex;
  }

}
</style>
