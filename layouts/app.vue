<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-header">
        <NuxtLink to="/app" class="sidebar-logo" @click="closeMobile">
          <span class="logo-icon">⟳</span>
        </NuxtLink>
        <button class="sidebar-close" aria-label="Cerrar menú" @click="closeMobile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Navegación principal">
        <NuxtLink
          v-for="item in navItems"
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

const navItems = [
  {
    to: '/app',
    label: 'Dashboard',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>'
  },
  {
    to: '/app/proyectos',
    label: 'Proyectos',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.354.77.054 1.543.082 2.32.082s1.55-.028 2.32-.082a41.2 41.2 0 0 0 3.238-.354c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3.164c-.78 0-1.552.028-2.32.082a41.2 41.2 0 0 0-3.238.354C4.873 3.746 3.75 5.14 3.75 6.74v6.02Z"/><path d="M6 6.75h.008v.008H6V6.75ZM18 6.75h.008v.008H18V6.75ZM8.25 3.164V4.5c0 .414.336.75.75.75h6a.75.75 0 0 0 .75-.75V3.164a48.394 48.394 0 0 0-7.5 0Z"/></svg>'
  },
  {
    to: '/app/ideas',
    label: 'Ideas',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18v-5.25m0 5.25a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Zm0-5.25V6.75m0 6.75c-2.485 0-4.5-2.515-4.5-5.625S9.515 3.75 12 3.75s4.5 2.515 4.5 5.625S14.485 12.75 12 12.75Z"/></svg>'
  },
  {
    to: '/app/tareas',
    label: 'Tareas',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08-1.131.094-1.976 1.057-1.976 2.192v9.75A2.25 2.25 0 0 0 7.5 18.75H18A2.25 2.25 0 0 0 20.25 16.5v-9.75A2.25 2.25 0 0 0 18 4.5H15a2.25 2.25 0 0 1-2.15-1.586Z"/></svg>'
  },
  {
    to: '/app/loops',
    label: 'Loops',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c.014.221.029.443.046.662a4.006 4.006 0 0 0 3.7 3.7 48.55 48.55 0 0 0 7.308 0 4.006 4.006 0 0 0 3.7-3.7c.033-.254.046-.508.046-.762m-15 0-3 3m3-3 3 3"/></svg>'
  }
]

const currentLabel = computed(() => {
  const match = navItems.find((item) => isActive(item.to))
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
  background: var(--gradient-1);
  color: white;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.3);
}

.logo-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
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
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-card-hover);
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
