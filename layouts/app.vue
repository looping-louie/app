<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-header">
        <NuxtLink to="/app" class="sidebar-logo" aria-label="Looping Louie home" @click="closeMobile">
          <img class="logo-icon" src="/brand/twemoji-small-airplane.svg" alt="" width="30" height="30">
        </NuxtLink>
        <button class="sidebar-close" aria-label="Cerrar menú" @click="closeMobile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Navegación principal">
        <template v-for="(group, groupIndex) in navGroups" :key="groupIndex">
          <div v-if="groupIndex > 0" class="nav-divider" />
          <NuxtLink
            v-for="item in group"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item.to) }"
            :aria-label="item.label"
            :title="item.label"
            @click="closeMobile"
          >
            <span class="nav-icon" v-html="item.icon" />
            <span class="nav-tooltip">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="user-avatar" title="Usuario" aria-label="Usuario">U</div>
      </div>
    </aside>

    <div class="sidebar-backdrop" :class="{ visible: mobileOpen }" @click="closeMobile" />

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

<script setup>
const route = useRoute()

const mobileOpen = ref(false)

const iconRuns = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75Z"/></svg>'
const iconObservability = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13.5h2.25l1.5-6 3 12 3-15 3 9 1.5-3H21"/></svg>'
const iconHumanReview = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25c0-3.59 3.36-6.75 7.5-6.75s7.5 3.16 7.5 6.75"/><path d="M19.5 3v3.75M19.5 10.5V6.75M19.5 6.75h3.75M19.5 6.75h-3.75"/></svg>'
const iconIdeas = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18v-5.25m0 5.25a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Zm0-5.25V6.75m0 6.75c-2.485 0-4.5-2.515-4.5-5.625S9.515 3.75 12 3.75s4.5 2.515 4.5 5.625S14.485 12.75 12 12.75Z"/></svg>'
const iconTasks = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08-1.131.094-1.976 1.057-1.976 2.192v9.75A2.25 2.25 0 0 0 7.5 18.75H18A2.25 2.25 0 0 0 20.25 16.5v-9.75A2.25 2.25 0 0 0 18 4.5H15a2.25 2.25 0 0 1-2.15-1.586Z"/></svg>'
const iconLoops = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c.014.221.029.443.046.662a4.006 4.006 0 0 0 3.7 3.7 48.55 48.55 0 0 0 7.308 0 4.006 4.006 0 0 0 3.7-3.7c.033-.254.046-.508.046-.762m-15 0-3 3m3-3 3 3"/></svg>'
const iconCouncils = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><circle cx="5" cy="14" r="2.5"/><circle cx="19" cy="14" r="2.5"/><path d="M12 11.5v3M9.5 13l-2 0M14.5 13l2 0"/></svg>'
const iconPersonas = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M4.5 20.25c0-3.59 3.36-6.75 7.5-6.75s7.5 3.16 7.5 6.75"/><path d="M18 4.5a3 3 0 0 1 0 5.66"/><path d="M19.5 14.5c2.5 1 3 3.5 3 5.75"/></svg>'
const iconSkills = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.25 5.25L19.5 9l-4 4 1 5.5L12 16l-4.5 2.5 1-5.5-4-4 5.25-.75L12 3Z"/></svg>'
const iconModels = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3m0 12v3M5.64 5.64l2.12 2.12m8.48 8.48l2.12 2.12M3 12h3m12 0h3M5.64 18.36l2.12-2.12m8.48-8.48l2.12-2.12"/><circle cx="12" cy="12" r="3.5"/></svg>'
const iconSettings = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.25h2.25l1.5-3h9l1.5 3H21v9H3v-9Z"/><circle cx="12" cy="12.75" r="3"/></svg>'

const navGroups = [
  [
    { to: '/app/runs', label: 'Runs', icon: iconRuns }
  ],
  [
    { to: '/app/observability', label: 'Observability', icon: iconObservability },
    { to: '/app/human-intervention', label: 'Human review', icon: iconHumanReview }
  ],
  [
    { to: '/app/ideas', label: 'Ideas', icon: iconIdeas },
    { to: '/app/tasks', label: 'Tasks', icon: iconTasks },
    { to: '/app/loops', label: 'Loops', icon: iconLoops }
  ],
  [
    { to: '/app/councils', label: 'Councils', icon: iconCouncils },
    { to: '/app/personas', label: 'Personas', icon: iconPersonas },
    { to: '/app/skills', label: 'Skills', icon: iconSkills },
    { to: '/app/models', label: 'Models', icon: iconModels }
  ],
  [
    { to: '/app/keys', label: 'Settings', icon: iconSettings }
  ]
]

const navItems = computed(() => navGroups.flat())

const currentLabel = computed(() => {
  const match = navItems.value.find((item) => isActive(item.to))
  return match ? match.label : 'Dashboard'
})

function isActive(to) {
  if (to === '/app') {
    return route.path === '/app'
  }
  return route.path === to || route.path.startsWith(to + '/')
}

function openMobile() {
  mobileOpen.value = true
}

function closeMobile() {
  mobileOpen.value = false
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-deep);
}

.sidebar {
  width: 64px;
  flex-shrink: 0;
  background: #08080d;
  border-right: 1px solid var(--border);
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
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  align-items: center;
  justify-content: center;
}

.sidebar-close:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  padding: 0 0.5rem;
  flex: 1;
  overflow-y: auto;
}

.nav-divider {
  height: 1px;
  width: 60%;
  margin: 0.5rem auto;
  background: var(--border);
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  border-radius: 0.625rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
  position: relative;
  flex-shrink: 0;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.nav-item:focus-visible {
  outline: 2px solid var(--accent-glow);
  outline-offset: 2px;
}

.nav-item.active {
  color: white;
  background: var(--gradient-card);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  border-radius: 0 3px 3px 0;
  background: var(--accent-glow);
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
  position: absolute;
  left: calc(100% + 0.75rem);
  top: 50%;
  transform: translateY(-50%) translateX(-8px);
  background: #1a1a28;
  border: 1px solid var(--border-glow);
  color: var(--text-primary);
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 300;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.nav-item:hover .nav-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.sidebar-footer {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  width: 100%;
  display: flex;
  justify-content: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.user-avatar:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.4rem;
  transition: border-color 0.2s, background 0.2s;
}

.menu-toggle:hover {
  border-color: var(--accent);
  background: var(--bg-card-hover);
}

.topbar-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.app-content {
  flex: 1;
  padding: 2rem;
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

  .app-content {
    padding: 1.25rem 1rem;
  }
}
</style>
