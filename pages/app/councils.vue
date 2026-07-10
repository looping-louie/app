<template>
  <div class="councils-page">
    <h1>Councils</h1>
    <p class="page-description">Configura y gestiona los consejos de agentes que refinarán tus ideas.</p>
    <div class="empty-state">
      <span class="empty-icon">👥</span>
      <p>No hay consejos configurados.</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Councils · Looping Louie'
})
</script>

<style scoped>
.councils-page {
  max-width: 900px;
}

.councils-page h1 {
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
