<template>
  <div class="proyectos-page">
    <h1>Proyectos</h1>
    <p class="page-description">Gestiona y organiza tus proyectos.</p>
    <div class="empty-state">
      <span class="empty-icon">📁</span>
      <p>No hay proyectos todavía.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Proyectos · Looping Louie'
})
</script>

<style scoped>
.proyectos-page {
  max-width: 900px;
}

.proyectos-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-card);
  border: 1px dashed var(--border-glow);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  color: var(--text-muted);
}
</style>
