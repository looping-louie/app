<template>
  <div class="idea-new-page">
    <div class="page-header">
      <NuxtLink to="/app/ideas" class="back-link">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M12.78 5.22a.75.75 0 0 0-1.06 0L6.47 10.47a.75.75 0 0 0 0 1.06l5.25 5.25a.75.75 0 1 0 1.06-1.06L8.06 11l4.72-4.72a.75.75 0 0 0 0-1.06Z"/></svg>
        Volver a Ideas
      </NuxtLink>
      <h1>Nueva idea</h1>
      <p class="page-description">Describe tu idea y configura un consejo de agentes para refinarla antes de convertirla en una especificación.</p>
    </div>

    <form class="idea-form" @submit.prevent="handleSubmit">
      <section class="form-section">
        <div class="section-header">
          <h2 class="section-title">Your prompt</h2>
          <p class="section-helper">Describe la idea que quieres discutir. Cuanto más contexto aportes — objetivos, restricciones, público objetivo — mejor podrán los agentes entenderla y refinarla.</p>
        </div>

        <div class="form-group">
          <label for="idea-title" class="form-label">Título</label>
          <input
            id="idea-title"
            v-model="title"
            type="text"
            class="form-input"
            placeholder="Ej: Sistema de feedback para revisiones de código"
          />
        </div>

        <div class="form-group">
          <label for="idea-prompt" class="form-label">Prompt</label>
          <textarea
            id="idea-prompt"
            v-model="prompt"
            class="form-textarea"
            rows="8"
            placeholder="Describe tu idea en detalle: qué problema resuelve, qué debe incluir, qué restricciones tienes..."
          ></textarea>
        </div>
      </section>

      <section class="form-section">
        <div class="section-header">
          <h2 class="section-title">Set your council</h2>
          <p class="section-helper">Incluye diferentes voces para discutir la idea. Cada agente aportará una perspectiva distinta — crítica, técnica, de producto — y juntos refinarán el resultado antes de convertirlo en una especificación.</p>
        </div>

        <div class="council-list">
          <div
            v-for="(agent, index) in agents"
            :key="index"
            class="council-row"
          >
            <input
              v-model="agent.name"
              type="text"
              class="form-input council-input"
              :placeholder="`Agente ${index + 1} — ej: Crítico técnico`"
            />
            <input
              v-model="agent.role"
              type="text"
              class="form-input council-input"
              placeholder="Rol / perspectiva"
            />
            <button
              type="button"
              class="btn-remove"
              aria-label="Eliminar agente"
              @click="removeAgent(index)"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
            </button>
          </div>
        </div>

        <button type="button" class="btn-add-agent" @click="addAgent">
          <span class="btn-icon">+</span>
          Añadir agente
        </button>
      </section>

      <div class="form-actions">
        <NuxtLink to="/app/ideas" class="btn-secondary">Cancelar</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="!canSubmit">
          Crear idea
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Nueva idea · Looping Louie'
})

const title = ref('')
const prompt = ref('')

const agents = ref([
  { name: '', role: '' }
])

const canSubmit = computed(() => title.value.trim() !== '' && prompt.value.trim() !== '')

function addAgent() {
  agents.value.push({ name: '', role: '' })
}

function removeAgent(index) {
  if (agents.value.length > 1) {
    agents.value.splice(index, 1)
  }
}

function handleSubmit() {
  // Placeholder — will be wired to backend later
}
</script>

<style scoped>
.idea-new-page {
  max-width: 760px;
}

.page-header {
  margin-bottom: 2.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text-primary);
}

.idea-new-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
}

.idea-form {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.form-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.section-header {
  margin-bottom: 1.75rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.section-helper {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.7rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.form-textarea {
  width: 100%;
  padding: 0.7rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
  outline: none;
  resize: vertical;
  min-height: 140px;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.council-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.council-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.council-input {
  flex: 1;
}

.btn-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-remove:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-add-agent {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1px dashed var(--border-glow);
  color: var(--text-secondary);
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-add-agent:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.btn-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.7rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  background: var(--gradient-1);
  border: none;
  color: white;
  padding: 0.7rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.55);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

@media (max-width: 640px) {
  .council-row {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-remove {
    align-self: flex-end;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-secondary,
  .btn-primary {
    justify-content: center;
  }
}
</style>