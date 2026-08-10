<template>
  <div class="observability-page">
    <h1>Observability</h1>
    <p class="page-description">Métricas, trazas y estado de los loops en ejecución.</p>
    <div class="empty-state">
      <span class="empty-icon">📈</span>
      <p>No hay datos de observabilidad disponibles.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Observability · Looping Louie'
})
</script>

<style scoped>
.observability-page {
  max-width: 900px;
}

.observability-page h1 {
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
