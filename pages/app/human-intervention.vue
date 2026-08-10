<template>
  <div class="human-review-page">
    <h1>Human review</h1>
    <p class="page-description">Revisa y aprueba los resultados que requieren intervención manual.</p>
    <div class="empty-state">
      <span class="empty-icon">👤</span>
      <p>No hay resultados pendientes de revisión humana.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Human review · Looping Louie'
})
</script>

<style scoped>
.human-review-page {
  max-width: 900px;
}

.human-review-page h1 {
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
