<template>
  <div class="app-layout">
    <header class="app-header">
      <NuxtLink to="/" class="app-logo">
        <img src="/brand/twemoji-small-airplane.svg" alt="" width="28" height="28">
        <span>Looping Louie</span>
      </NuxtLink>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <footer class="app-footer">
      <nav class="app-footer-nav">
        <NuxtLink to="/legal/imprint">Imprint</NuxtLink>
        <NuxtLink to="/legal/privacy">Privacy</NuxtLink>
        <NuxtLink to="/legal/terms">Terms</NuxtLink>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
}

.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  text-decoration: none;
  color: inherit;
}

.app-logo img {
  width: 1.75rem;
  height: 1.75rem;
}

.app-main {
  flex: 1;
  padding: 1rem;
}

.app-footer {
  padding: 1rem;
  border-top: 1px solid #e5e5e5;
}

.app-footer-nav {
  display: flex;
  gap: 1rem;
}

.app-footer-nav a {
  text-decoration: none;
  color: inherit;
}

.app-footer-nav a:hover {
  text-decoration: underline;
}
</style>
