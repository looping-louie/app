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
      <div class="list-header">
        <NuxtLink to="/app/ideas/new" class="btn-primary">
          <span class="btn-icon">+</span>
          Nueva idea
        </NuxtLink>
      </div>

      <div class="stacked-list">
        <div
          v-for="(idea, index) in ideas"
          :key="idea.id"
          class="list-row"
          :class="{ last: index === ideas.length - 1 }"
        >
          <div class="row-main">
            <div class="row-top">
              <NuxtLink :to="`/app/ideas/${idea.id}`" class="row-title-link">
                <h3 class="row-title">{{ idea.title }}</h3>
              </NuxtLink>
              <span class="row-status" :class="`status-${idea.status}`">
                <span class="status-dot"></span>
                {{ statusLabel(idea.status) }}
              </span>
            </div>

            <div class="row-meta">
              <span class="meta-author">
                <span class="meta-avatar" :style="{ background: avatarColor(idea.user) }">{{ idea.user.charAt(0) }}</span>
                <span class="meta-name">{{ idea.user }}</span>
              </span>
              <span class="meta-sep">·</span>
              <span class="meta-time">{{ timeAgo(idea.createdAt) }}</span>
            </div>

            <p class="row-prompt">{{ idea.prompt }}</p>
          </div>

          <div class="row-side">
            <div class="avatar-group">
              <span
                v-for="(agent, ai) in idea.agents"
                :key="agent"
                class="avatar-group-item"
                :style="{ background: agentColor(agent), zIndex: idea.agents.length - ai }"
                :title="agent"
              >{{ agent.charAt(0) }}</span>
              <span v-if="idea.agents.length > 4" class="avatar-overflow">+{{ idea.agents.length - 4 }}</span>
            </div>

            <div class="row-stats">
              <span class="stat-chip" :title="`${idea.messageCount} mensajes del consejo`">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h13A1.5 1.5 0 0 1 18 4.5v8a1.5 1.5 0 0 1-1.5 1.5H7l-4 3.5V4.5Z"/></svg>
                <span class="stat-count">{{ idea.messageCount }}</span>
              </span>

              <span
                v-if="idea.status === 'resolved'"
                class="stat-chip stat-doc"
                title="ideas.md generado"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M4 2.5A1.5 1.5 0 0 1 5.5 1H12l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 17.5v-15Z"/><path d="M12 1v4h4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
                <span class="stat-label">ideas.md</span>
              </span>

              <span
                v-else
                class="stat-chip stat-pending"
                :title="idea.status === 'running' ? 'Consejo en ejecución' : 'Pendiente de ejecutar'"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M4 2.5A1.5 1.5 0 0 1 5.5 1H12l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 17.5v-15Z"/><path d="M8 9h6M8 12h4" stroke="rgba(0,0,0,0.3)" stroke-width="1.2" stroke-linecap="round"/></svg>
                <span class="stat-label">{{ idea.status === 'running' ? 'En curso' : 'Pendiente' }}</span>
              </span>
            </div>

            <NuxtLink :to="`/app/ideas/${idea.id}`" class="row-open-link">
              Ver detalle
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M7.22 14.78a.75.75 0 0 1 0-1.06L10.94 10 7.22 6.28a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"/></svg>
            </NuxtLink>
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

const sampleIdeas = [
  {
    id: 'idea-1',
    title: 'Sistema de feedback para revisiones de código',
    prompt: 'Un sistema que permita dejar feedback contextualizado en revisiones de código, integrándose con GitHub y Bitbucket. Debe soportar hilos de discusión, resolución de comentarios y métricas de calidad por PR.',
    user: 'María González',
    agents: ['Product Manager', 'Tech Lead', 'UX Designer', "Devil's Advocate", 'Editor'],
    status: 'resolved',
    messageCount: 23,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'idea-2',
    title: 'Dashboard de métricas en tiempo real para loops',
    prompt: 'Crear un dashboard que muestre el estado de todos los loops en ejecución, con métricas de coste, latencia y tasa de aprobación. Debe actualizarse en tiempo real vía WebSocket.',
    user: 'Carlos Ruiz',
    agents: ['Founder', 'Growth', 'Platform Architect', 'Finance'],
    status: 'running',
    messageCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'idea-3',
    title: 'Moderación automática de contenido con escalado humano',
    prompt: 'Sistema de moderación que combine modelos LLM baratos para una primera clasificación y modelos frontier para casos dudosos, escalando a humanos solo cuando la confianza sea baja.',
    user: 'Ana Torres',
    agents: ['Product Manager', 'Enterprise Customer', 'Tech Lead', 'Finance', "Devil's Advocate", 'Editor'],
    status: 'pending',
    messageCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 'idea-4',
    title: 'Generador de tests unitarios a partir de especificaciones',
    prompt: 'A partir de una especificación en Markdown, generar tests unitarios automáticamente usando un modelo generador barato y validarlos con revisores frontier. El loop continúa hasta que los tests pasan.',
    user: 'Diego Vega',
    agents: ['Tech Lead', 'Platform Architect', 'Editor'],
    status: 'resolved',
    messageCount: 31,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  }
]

const ideas = ref([])

onMounted(() => {
  const stored = JSON.parse(localStorage.getItem('looping-louie:ideas') || '[]')
  ideas.value = [...stored, ...sampleIdeas]
})

function statusLabel(status) {
  const labels = {
    resolved: 'Resuelto',
    running: 'En curso',
    pending: 'Pendiente'
  }
  return labels[status] || status
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'hace menos de 1 min'
  if (minutes < 60) return `hace ${minutes} min`
  if (hours < 24) return `hace ${hours} h`
  return `hace ${days} d`
}

const userPalette = ['#7c3aed', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
const agentPalette = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6']

function avatarColor(name) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return userPalette[hash % userPalette.length]
}

function agentColor(name) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return agentPalette[hash % agentPalette.length]
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

.list-header {
  display: flex;
  justify-content: flex-end;
}

.stacked-list {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s;
}

.list-row:hover {
  background: var(--bg-card-hover);
}

.list-row.last {
  border-bottom: none;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.row-title-link {
  text-decoration: none;
}

.row-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  transition: color 0.2s;
}

.row-title-link:hover .row-title {
  color: var(--accent-soft);
}

.row-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-resolved {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-resolved .status-dot {
  background: #34d399;
}

.status-running {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-running .status-dot {
  background: #fbbf24;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-pending {
  background: rgba(122, 122, 144, 0.15);
  color: var(--text-muted);
}

.status-pending .status-dot {
  background: var(--text-muted);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.meta-author {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.meta-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.meta-name {
  color: var(--text-secondary);
  font-weight: 500;
}

.meta-sep {
  opacity: 0.5;
}

.meta-time {
  font-weight: 500;
}

.row-prompt {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.avatar-group {
  display: flex;
  align-items: center;
}

.avatar-group-item {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: white;
  border: 2px solid var(--bg-card);
  margin-left: -8px;
  position: relative;
}

.avatar-group-item:first-child {
  margin-left: 0;
}

.list-row:hover .avatar-group-item {
  border-color: var(--bg-card-hover);
}

.avatar-overflow {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface);
  border: 2px solid var(--bg-card);
  margin-left: -8px;
}

.list-row:hover .avatar-overflow {
  border-color: var(--bg-card-hover);
}

.row-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
}

.stat-chip svg {
  opacity: 0.7;
}

.stat-count {
  color: var(--text-primary);
}

.stat-doc {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.25);
  background: rgba(52, 211, 153, 0.08);
}

.stat-doc svg {
  opacity: 1;
}

.stat-pending {
  color: var(--text-muted);
}

.row-open-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-soft);
  text-decoration: none;
  transition: color 0.2s;
}

.row-open-link:hover {
  color: var(--accent-glow);
}

@media (max-width: 640px) {
  .list-row {
    flex-direction: column;
    gap: 1rem;
  }

  .row-side {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .row-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>