<template>
  <div class="ideas-page">
    <div class="page-header">
      <div>
        <h1>Ideas</h1>
        <p class="page-description">Refina tus ideas de desarrollo con un modelo y convierte el resultado en especificaciones Markdown.</p>
      </div>
    </div>

    <div v-if="ideas.length === 0" class="empty-state">
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

    <div v-else class="ideas-list">
      <NuxtLink to="/app/ideas/new" class="btn-primary">
        <span class="btn-icon">+</span>
        Nueva idea
      </NuxtLink>

      <div class="idea-cards">
        <div v-for="idea in ideas" :key="idea.id" class="idea-card">
          <div class="idea-card-header">
            <h3 class="idea-title">{{ idea.title }}</h3>
            <span class="idea-date">{{ formatDate(idea.createdAt) }}</span>
          </div>
          <p class="idea-prompt">{{ idea.prompt }}</p>
          <div class="idea-agents">
            <span
              v-for="agent in idea.agents"
              :key="agent"
              class="agent-chip"
            >{{ agent }}</span>
          </div>
        </div>
      </div>
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

const ideas = ref([])

onMounted(() => {
  ideas.value = JSON.parse(localStorage.getItem('looping-louie:ideas') || '[]')
})

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
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

.ideas-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.idea-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.idea-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.idea-card:hover {
  border-color: var(--accent-soft);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);
}

.idea-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.idea-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.idea-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.idea-prompt {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.idea-agents {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.agent-chip {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-soft);
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 1rem;
  padding: 0.2rem 0.6rem;
}
</style>