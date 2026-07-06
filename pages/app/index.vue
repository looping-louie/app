<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p class="page-description">Vista general de las ejecuciones de Looping Louie: loops programados, en preparación, en ejecución y completados.</p>
      </div>
      <button class="btn-new-loop" type="button" disabled>
        <span class="btn-icon">+</span>
        Nuevo loop
      </button>
    </div>

    <div class="kanban-board">
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-dot dot-scheduled"></span>
          <h2 class="column-title">Programados</h2>
          <span class="column-count">2</span>
        </div>
        <div class="column-body">
          <div class="loop-card">
            <div class="loop-card-header">
              <span class="loop-name">Revisión de código — Sprint 24</span>
              <span class="loop-badge badge-scheduled">Programado</span>
            </div>
            <p class="loop-detail">Generador: mistral-7b · Revisores: 2</p>
            <p class="loop-meta">Inicia: 15:30 · Umbral: 0.92</p>
          </div>
          <div class="loop-card">
            <div class="loop-card-header">
              <span class="loop-name">Moderación de contenido</span>
              <span class="loop-badge badge-scheduled">Programado</span>
            </div>
            <p class="loop-detail">Generador: qwen3-235b · Revisores: 3</p>
            <p class="loop-meta">Inicia: 16:00 · Umbral: 0.95</p>
          </div>
        </div>
      </div>

      <div class="kanban-column">
        <div class="column-header">
          <span class="column-dot dot-prep"></span>
          <h2 class="column-title">En preparación</h2>
          <span class="column-count">1</span>
        </div>
        <div class="column-body">
          <div class="loop-card">
            <div class="loop-card-header">
              <span class="loop-name">Resumen de documentos</span>
              <span class="loop-badge badge-prep">Preparando</span>
            </div>
            <p class="loop-detail">Generador: llama-3.3-70b · Revisores: 2</p>
            <p class="loop-meta">Configurando revisores · Umbral: 0.88</p>
          </div>
        </div>
      </div>

      <div class="kanban-column">
        <div class="column-header">
          <span class="column-dot dot-running"></span>
          <h2 class="column-title">En ejecución</h2>
          <span class="column-count">1</span>
        </div>
        <div class="column-body">
          <div class="loop-card">
            <div class="loop-card-header">
              <span class="loop-name">Razonamiento multi-agente</span>
              <span class="loop-badge badge-running">Ejecutando</span>
            </div>
            <p class="loop-detail">Generador: deepseek-v4 · Revisores: 3</p>
            <p class="loop-meta">Intento 2 de 3 · Puntuación: 0.87</p>
            <div class="loop-progress">
              <div class="loop-progress-bar" style="width: 72%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="kanban-column">
        <div class="column-header">
          <span class="column-dot dot-done"></span>
          <h2 class="column-title">Completados</h2>
          <span class="column-count">2</span>
        </div>
        <div class="column-body">
          <div class="loop-card">
            <div class="loop-card-header">
              <span class="loop-name">Clasificación de tickets</span>
              <span class="loop-badge badge-done">Completado</span>
            </div>
            <p class="loop-detail">Generador: gpt-oss-20b · Revisores: 2</p>
            <p class="loop-meta">Finalizado: 14:12 · Puntuación: 0.94</p>
          </div>
          <div class="loop-card">
            <div class="loop-card-header">
              <span class="loop-name">Traducción técnica</span>
              <span class="loop-badge badge-done">Completado</span>
            </div>
            <p class="loop-detail">Generador: gemma-4-31b · Revisores: 2</p>
            <p class="loop-meta">Finalizado: 13:05 · Puntuación: 0.96</p>
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
  title: 'Dashboard · Looping Louie'
})
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.dashboard-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
  max-width: 600px;
}

.btn-new-loop {
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
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
  flex-shrink: 0;
}

.btn-new-loop:hover {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.55);
  transform: translateY(-1px);
}

.btn-new-loop:disabled {
  cursor: not-allowed;
  opacity: 0.85;
}

.btn-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.kanban-column {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-scheduled {
  background: #a78bfa;
}

.dot-prep {
  background: #fbbf24;
}

.dot-running {
  background: #34d399;
}

.dot-done {
  background: #60a5fa;
}

.column-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.column-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 0.1rem 0.5rem;
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.loop-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.85rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.loop-card:hover {
  border-color: var(--accent-soft);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);
}

.loop-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.loop-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.loop-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-scheduled {
  background: rgba(167, 139, 250, 0.15);
  color: #a78bfa;
}

.badge-prep {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.badge-running {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.badge-done {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.loop-detail {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.loop-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.loop-progress {
  margin-top: 0.6rem;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.loop-progress-bar {
  height: 100%;
  background: var(--gradient-1);
  border-radius: 2px;
}

@media (max-width: 1024px) {
  .kanban-board {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
  }
}
</style>
