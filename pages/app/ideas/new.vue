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
          <p class="section-helper">Selecciona los agentes que discutirán la idea. Cada uno aportará una perspectiva distinta — crítica, técnica, de producto — y juntos refinarán el resultado antes de convertirlo en una especificación.</p>
        </div>

        <div class="council-grid">
          <button
            v-for="agent in availableAgents"
            :key="agent.name"
            type="button"
            class="council-card"
            :class="{ selected: selectedAgents.includes(agent.name) }"
            :aria-pressed="selectedAgents.includes(agent.name)"
            @click="toggleAgent(agent.name)"
          >
            <div class="council-illustration">
              <span class="illustration-icon" v-html="agent.icon"></span>
            </div>
            <h3 class="council-name">{{ agent.name }}</h3>
            <p class="council-question">{{ agent.question }}</p>
            <span class="council-check" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.793 2.793 6.793-6.893a1 1 0 0 1 1.414-.006Z"/></svg>
            </span>
          </button>
        </div>
      </section>

      <div class="form-actions">
        <NuxtLink to="/app/ideas" class="btn-secondary">Cancelar</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="!canSubmit">
          Run Council
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

const router = useRouter()

const title = ref('')
const prompt = ref('')

const availableAgents = [
  {
    name: 'Product Manager',
    question: '¿Qué problema resuelve?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="9" width="36" height="30" rx="3"/><path d="M14 9v30M34 9v30M6 18h36M6 30h36"/></svg>'
  },
  {
    name: 'Founder',
    question: '¿Hace crecer la empresa?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40h32M14 40V20M24 40V12M34 40V24M14 20l10-8 10 16"/></svg>'
  },
  {
    name: 'UX Designer',
    question: '¿Cómo sería la experiencia?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="36" height="26" rx="3"/><path d="M18 40h12M24 34v6M6 26h36"/></svg>'
  },
  {
    name: 'Tech Lead',
    question: '¿Cómo se implementaría?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 14L8 24l10 10M30 14l10 10-10 10M26 10l-4 28"/></svg>'
  },
  {
    name: 'Enterprise Customer',
    question: '¿Lo pagaría?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="14" width="32" height="22" rx="2"/><path d="M8 20h32M14 30h6"/></svg>'
  },
  {
    name: 'Growth',
    question: '¿Ayuda a vender?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40V26M18 40V18M28 40V10M38 40V22M8 26l10-8 10 6 10-12"/><path d="M34 12h4v4"/></svg>'
  },
  {
    name: "Devil's Advocate",
    question: '¿Por qué es una mala idea?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><path d="M16 20h.01M32 20h.01M16 32s3-4 8-4 8 4 8 4"/></svg>'
  },
  {
    name: 'Finance',
    question: '¿Cuál es el ROI?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><path d="M24 14v20M18 20h9a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h9"/></svg>'
  },
  {
    name: 'Platform Architect',
    question: '¿Encaja con la visión?',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8L8 16l16 8 16-8-16-8Z"/><path d="M8 24l16 8 16-8M8 32l16 8 16-8"/></svg>'
  },
  {
    name: 'Editor',
    question: 'Convierte todo en un markdown limpio.',
    icon: '<svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h32M8 20h32M8 28h20M8 36h24"/></svg>'
  }
]

const selectedAgents = ref([])

const canSubmit = computed(() =>
  title.value.trim() !== '' &&
  prompt.value.trim() !== '' &&
  selectedAgents.value.length > 0
)

function toggleAgent(name) {
  const index = selectedAgents.value.indexOf(name)
  if (index === -1) {
    selectedAgents.value.push(name)
  } else {
    selectedAgents.value.splice(index, 1)
  }
}

function handleSubmit() {
  if (!canSubmit.value) return

  const idea = {
    id: crypto.randomUUID(),
    title: title.value.trim(),
    prompt: prompt.value.trim(),
    agents: [...selectedAgents.value],
    createdAt: new Date().toISOString()
  }

  const stored = JSON.parse(localStorage.getItem('looping-louie:ideas') || '[]')
  stored.push(idea)
  localStorage.setItem('looping-louie:ideas', JSON.stringify(stored))

  router.push('/app/ideas')
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

.council-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.council-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
  padding: 1.5rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  font-family: inherit;
}

.council-card:hover {
  border-color: var(--accent-soft);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);
}

.council-card.selected {
  border-color: var(--accent);
  background: var(--gradient-card);
  box-shadow: 0 0 0 1px var(--accent), 0 4px 16px rgba(124, 58, 237, 0.2);
}

.council-illustration {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  background: var(--bg-card-hover);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: color 0.2s, border-color 0.2s;
}

.council-card:hover .council-illustration {
  color: var(--text-primary);
  border-color: var(--accent-soft);
}

.council-card.selected .council-illustration {
  color: var(--accent-glow);
  border-color: var(--accent);
  background: rgba(124, 58, 237, 0.08);
}

.illustration-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-icon :deep(svg) {
  width: 32px;
  height: 32px;
}

.council-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.council-question {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.council-check {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gradient-1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}

.council-card.selected .council-check {
  opacity: 1;
  transform: scale(1);
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
  .council-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-secondary,
  .btn-primary {
    justify-content: center;
  }
}

@media (max-width: 420px) {
  .council-grid {
    grid-template-columns: 1fr;
  }
}
</style>