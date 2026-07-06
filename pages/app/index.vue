<template>
  <div class="dashboard-page">
    <h1>Dashboard</h1>
    <p class="page-description">Bienvenido. Aquí verás un resumen general de tu actividad.</p>
    <div class="placeholder-grid">
      <div class="placeholder-card">
        <span class="placeholder-icon">⚡</span>
        <h3>Loops activos</h3>
        <p class="placeholder-value">—</p>
      </div>
      <div class="placeholder-card">
        <span class="placeholder-icon">📁</span>
        <h3>Proyectos</h3>
        <p class="placeholder-value">—</p>
      </div>
      <div class="placeholder-card">
        <span class="placeholder-icon">✅</span>
        <h3>Tareas</h3>
        <p class="placeholder-value">—</p>
      </div>
      <div class="placeholder-card">
        <span class="placeholder-icon">💡</span>
        <h3>Ideas</h3>
        <p class="placeholder-value">—</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Dashboard · Looping Louie'
})
</script>

<style scoped>
.dashboard-page {
  max-width: 900px;
}

.dashboard-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.placeholder-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.placeholder-card:hover {
  border-color: var(--accent-soft);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
}

.placeholder-icon {
  font-size: 1.8rem;
  display: block;
  margin-bottom: 0.75rem;
}

.placeholder-card h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.placeholder-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
