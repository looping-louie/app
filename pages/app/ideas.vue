<template>
  <div class="ideas-page">
    <div class="page-header">
      <div>
        <h1>Ideas</h1>
        <p class="page-description">Refina tus ideas de desarrollo con un modelo y convierte el resultado en especificaciones Markdown.</p>
      </div>
    </div>

    <div class="empty-state">
      <div class="empty-icon-wrapper">
        <span class="empty-icon">💡</span>
      </div>
      <h2 class="empty-title">Aún no hay ideas</h2>
      <p class="empty-text">Captura tu primera idea y deja que Looping Louie la refine con un modelo para convertirla en una especificación lista para ejecutar.</p>
      <NuxtLink to="/app/ideas/new" class="btn-primary">
        <span class="btn-icon">+</span>
        Crear primera idea
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Ideas · Looping Louie'
})
</script>

<style scoped>
.ideas-page {
  max-width: 900px;
}

.page-header {
  margin-bottom: 2.5rem;
}

.ideas-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 4.5rem 2rem;
  background: var(--bg-card);
  border: 1px dashed var(--border-glow);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--gradient-card);
  border: 1px solid var(--border-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 24px rgba(124, 58, 237, 0.15);
  margin-bottom: 0.5rem;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.empty-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
}

.empty-text {
  color: var(--text-muted);
  max-width: 440px;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient-1);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.55);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.2rem;
  line-height: 1;
}
</style>
