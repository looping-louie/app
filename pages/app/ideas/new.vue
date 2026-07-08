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

    <div class="wizard-shell">
      <div
        class="progress-indicator"
        role="group"
        aria-label="Progreso del asistente"
      >
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-meta">
          <span class="progress-label">Paso {{ currentStep + 1 }} de {{ steps.length }}</span>
          <span class="progress-status">{{ progressStatus }}</span>
        </div>
      </div>

      <form class="wizard-form" @submit.prevent="handleSubmit">
        <!-- Step 0: Title -->
        <section
          v-show="currentStep === 0"
          class="form-section"
          aria-labelledby="step-0-title"
        >
          <div class="section-header">
            <h2 id="step-0-title" class="section-title">Your prompt</h2>
            <p class="section-helper">Describe la idea que quieres discutir. Cuanto más contexto aportes — objetivos, restricciones, público objetivo — mejor podrán los agentes entenderla y refinarla.</p>
          </div>

          <div class="form-group">
            <label for="idea-title" class="form-label">Título</label>
            <input
              id="idea-title"
              ref="titleInput"
              v-model="title"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.title }"
              :aria-invalid="errors.title ? 'true' : null"
              :aria-describedby="errors.title ? 'idea-title-error' : null"
              placeholder="Ej: Sistema de feedback para revisiones de código"
              @input="clearError('title')"
            />
            <p
              v-if="errors.title"
              id="idea-title-error"
              class="field-error"
              role="alert"
            >
              {{ errors.title }}
            </p>
          </div>

          <div class="form-group">
            <label for="idea-prompt" class="form-label">Prompt</label>
            <textarea
              id="idea-prompt"
              ref="promptInput"
              v-model="prompt"
              class="form-textarea"
              :class="{ 'input-error': errors.prompt }"
              :aria-invalid="errors.prompt ? 'true' : null"
              :aria-describedby="errors.prompt ? 'idea-prompt-error' : null"
              rows="8"
              placeholder="Describe tu idea en detalle: qué problema resuelve, qué debe incluir, qué restricciones tienes..."
              @keydown.meta.enter.prevent="goNext"
              @keydown.ctrl.enter.prevent="goNext"
              @input="clearError('prompt')"
            ></textarea>
            <p
              v-if="errors.prompt"
              id="idea-prompt-error"
              class="field-error"
              role="alert"
            >
              {{ errors.prompt }}
            </p>
            <p v-else class="field-hint">Pulsa <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>Enter</kbd> para continuar.</p>
          </div>
        </section>

        <!-- Step 1: Council -->
        <section
          v-show="currentStep === 1"
          class="form-section"
          aria-labelledby="step-1-title"
        >
          <div class="section-header">
            <h2 id="step-1-title" class="section-title">Set your council</h2>
            <p class="section-helper">Selecciona los agentes que discutirán la idea. Cada uno aportará una perspectiva distinta — crítica, técnica, de producto — y juntos refinarán el resultado antes de convertirlo en una especificación.</p>
          </div>

          <div class="council-summary" aria-live="polite">
            <span class="council-count">{{ selectedAgents.length }} seleccionado{{ selectedAgents.length === 1 ? '' : 's' }}</span>
            <button
              v-if="selectedAgents.length > 0"
              type="button"
              class="council-clear"
              @click="clearAgents"
            >
              Limpiar selección
            </button>
          </div>

          <fieldset class="council-fieldset">
            <legend class="council-legend">Agentes disponibles</legend>
            <div class="council-grid">
              <label
                v-for="agent in availableAgents"
                :key="agent.name"
                class="council-card"
                :class="{ selected: selectedAgents.includes(agent.name) }"
              >
                <input
                  type="checkbox"
                  class="council-checkbox"
                  :checked="selectedAgents.includes(agent.name)"
                  :aria-label="agent.name"
                  @change="toggleAgent(agent.name)"
                />
                <span class="council-illustration" aria-hidden="true">
                  <span class="illustration-icon" v-html="agent.icon"></span>
                </span>
                <span class="council-body">
                  <span class="council-name">{{ agent.name }}</span>
                  <span class="council-question">{{ agent.question }}</span>
                </span>
                <span class="council-check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.793 2.793 6.793-6.893a1 1 0 0 1 1.414-.006Z"/></svg>
                </span>
              </label>
            </div>
          </fieldset>

          <p
            v-if="errors.agents"
            class="field-error"
            role="alert"
          >
            {{ errors.agents }}
          </p>
        </section>

        <!-- Step 2: Max iterations -->
        <section
          v-show="currentStep === 2"
          class="form-section"
          aria-labelledby="step-2-title"
        >
          <div class="section-header">
            <h2 id="step-2-title" class="section-title">Maximum iterations</h2>
            <p class="section-helper">Define cuántas veces puede el consejo refinar la idea antes de entregar el resultado. Más iteraciones permiten mayor calidad, pero consumen más tokens.</p>
          </div>

          <div class="form-group">
            <label for="max-iterations" class="form-label">Número máximo de iteraciones</label>
            <input
              id="max-iterations"
              ref="iterationsInput"
              v-model.number="maxIterations"
              type="number"
              class="form-input"
              min="1"
              max="10"
              step="1"
              inputmode="numeric"
            />
          </div>

          <div class="iterations-presets" role="group" aria-label="Valores rápidos">
            <button
              v-for="value in iterationPresets"
              :key="value"
              type="button"
              class="preset-chip"
              :class="{ selected: maxIterations === value }"
              :aria-pressed="maxIterations === value"
              @click="maxIterations = value"
            >
              {{ value }}
            </button>
          </div>
        </section>

        <!-- Step 3: Model -->
        <section
          v-show="currentStep === 3"
          class="form-section"
          aria-labelledby="step-3-title"
        >
          <div class="section-header">
            <h2 id="step-3-title" class="section-title">Choose your model</h2>
            <p class="section-helper">Selecciona el modelo generador que producirá la primera versión de la especificación. Los revisores evaluarán su salida en cada iteración.</p>
          </div>

          <div class="model-list" role="radiogroup" aria-label="Selecciona un modelo">
            <button
              v-for="model in availableModels"
              :key="model.name"
              type="button"
              class="model-option"
              :class="{ selected: selectedModel === model.name }"
              role="radio"
              :aria-checked="selectedModel === model.name"
              @click="selectedModel = model.name"
              @keydown.enter.prevent="selectedModel = model.name"
            >
              <div class="model-option-radio" aria-hidden="true">
                <span class="radio-dot" :class="{ checked: selectedModel === model.name }"></span>
              </div>
              <div class="model-option-body">
                <div class="model-option-header">
                  <span class="model-option-name">{{ model.name }}</span>
                  <span class="model-option-price">${{ model.input.toFixed(2) }}/1M in</span>
                </div>
                <p class="model-option-detail">Salida: ${{ model.output.toFixed(2) }}/1M tokens</p>
              </div>
            </button>
          </div>
        </section>

        <!-- Step 4: Summary -->
        <section
          v-show="currentStep === 4"
          class="form-section"
          aria-labelledby="step-4-title"
        >
          <div class="section-header">
            <h2 id="step-4-title" class="section-title">Review and run</h2>
            <p class="section-helper">Revisa la configuración del consejo antes de ejecutarlo. Puedes volver atrás para ajustar cualquier respuesta.</p>
          </div>

          <dl class="summary-list">
            <div class="summary-row">
              <dt class="summary-label">Título</dt>
              <dd class="summary-value">{{ title || '—' }}</dd>
            </div>
            <div class="summary-row">
              <dt class="summary-label">Prompt</dt>
              <dd class="summary-value summary-prompt">{{ prompt || '—' }}</dd>
            </div>
            <div class="summary-row">
              <dt class="summary-label">Consejo</dt>
              <dd class="summary-value">
                <span v-if="selectedAgents.length" class="summary-chips">
                  <span v-for="agent in selectedAgents" :key="agent" class="summary-chip">{{ agent }}</span>
                </span>
                <span v-else>—</span>
              </dd>
            </div>
            <div class="summary-row">
              <dt class="summary-label">Iteraciones máximas</dt>
              <dd class="summary-value">{{ maxIterations }}</dd>
            </div>
            <div class="summary-row">
              <dt class="summary-label">Modelo</dt>
              <dd class="summary-value">{{ selectedModel || '—' }}</dd>
            </div>
          </dl>
        </section>

        <div class="form-actions">
          <button
            v-if="currentStep > 0"
            type="button"
            class="btn-secondary"
            @click="goBack"
          >
            Atrás
          </button>

          <span class="actions-spacer"></span>

          <NuxtLink to="/app/ideas" class="btn-secondary">Cancelar</NuxtLink>

          <button
            v-if="currentStep < steps.length - 1"
            type="button"
            class="btn-primary"
            :disabled="!canAdvance"
            @click="goNext"
          >
            Guardar y continuar
          </button>
          <button
            v-else
            type="submit"
            class="btn-primary"
            :disabled="!canSubmit"
          >
            Run Council
          </button>
        </div>
      </form>
    </div>
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

const steps = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'council', label: 'Consejo' },
  { key: 'iterations', label: 'Iteraciones' },
  { key: 'model', label: 'Modelo' },
  { key: 'summary', label: 'Resumen' }
]

const currentStep = ref(0)

const title = ref('')
const prompt = ref('')
const selectedAgents = ref([])
const maxIterations = ref(3)
const selectedModel = ref('')

const errors = reactive({
  title: '',
  prompt: '',
  agents: ''
})

const titleInput = ref(null)
const promptInput = ref(null)
const iterationsInput = ref(null)

const iterationPresets = [1, 3, 5, 10]

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

const availableModels = [
  { name: 'DeepSeek V4 Pro', input: 1.74, output: 3.48 },
  { name: 'MiniMax M3', input: 0.30, output: 1.20 },
  { name: 'Kimi K2.7 Code', input: 0.95, output: 4.00 },
  { name: 'GLM-5.2', input: 1.40, output: 4.40 },
  { name: 'LFM2 24B A2B', input: 0.03, output: 0.12 },
  { name: 'Gemma 4 31B', input: 0.39, output: 0.97 },
  { name: 'NVIDIA Nemotron 3 Ultra', input: 0.60, output: 3.60 },
  { name: 'Qwen3.7-Plus', input: 0.32, output: 1.28 },
  { name: 'Kimi K2.6', input: 1.20, output: 4.50 },
  { name: 'Qwen3.7-Max', input: 1.25, output: 3.75 },
  { name: 'gpt-oss-120B', input: 0.15, output: 0.60 },
  { name: 'Qwen3.5-397B-A17B', input: 0.60, output: 3.60 },
  { name: 'Qwen3.5 9B', input: 0.17, output: 0.25 },
  { name: 'Gemma-4-31B-it-Pearl', input: 0.28, output: 0.86 },
  { name: 'Cogito v2.1 671B', input: 1.25, output: 1.25 },
  { name: 'RnJ-1 Instruct', input: 0.15, output: 0.15 },
  { name: 'Llama 3.3 70B', input: 1.04, output: 1.04 },
  { name: 'Gemma 3n E4B Instruct', input: 0.06, output: 0.12 },
  { name: 'gpt-oss-20B', input: 0.05, output: 0.20 },
  { name: 'Qwen3 235B A22B FP8 Throughput', input: 0.20, output: 0.60 },
  { name: 'MiniMax M2.5', input: 0.30, output: 1.20 },
  { name: 'GLM-5.1', input: 1.40, output: 4.40 },
  { name: 'MiniMax M2.7', input: 0.30, output: 1.20 },
  { name: 'Qwen3.6-Plus', input: 0.50, output: 3.00 },
  { name: 'Qwen2.5 7B Instruct Turbo', input: 0.30, output: 0.30 },
  { name: 'Llama 3 8B Instruct Lite', input: 0.14, output: 0.14 },
  { name: 'Qwen3 235B A22B Instruct 2507 FP8 Throughput', input: 0.20, output: 0.60 }
]

const progressPercent = computed(() => {
  return (currentStep.value / (steps.length - 1)) * 100
})

const progressStatus = computed(() => {
  if (currentStep.value === steps.length - 1) {
    return 'Completado'
  }
  return `${steps[currentStep.value].label}`
})

const canAdvance = computed(() => {
  switch (currentStep.value) {
    case 0:
      return title.value.trim() !== '' && prompt.value.trim() !== ''
    case 1:
      return selectedAgents.value.length > 0
    case 2:
      return maxIterations.value >= 1 && maxIterations.value <= 10
    case 3:
      return selectedModel.value !== ''
    default:
      return true
  }
})

const canSubmit = computed(() =>
  title.value.trim() !== '' &&
  prompt.value.trim() !== '' &&
  selectedAgents.value.length > 0 &&
  maxIterations.value >= 1 &&
  maxIterations.value <= 10 &&
  selectedModel.value !== ''
)

function clearError(field) {
  if (errors[field]) {
    errors[field] = ''
  }
}

function toggleAgent(name) {
  errors.agents = ''
  const index = selectedAgents.value.indexOf(name)
  if (index === -1) {
    selectedAgents.value.push(name)
  } else {
    selectedAgents.value.splice(index, 1)
  }
}

function clearAgents() {
  selectedAgents.value = []
  errors.agents = ''
}

function validateStep(step) {
  if (step === 0) {
    let valid = true
    if (title.value.trim() === '') {
      errors.title = 'El título es obligatorio.'
      valid = false
    } else {
      errors.title = ''
    }
    if (prompt.value.trim() === '') {
      errors.prompt = 'El prompt es obligatorio.'
      valid = false
    } else {
      errors.prompt = ''
    }
    return valid
  }
  if (step === 1) {
    if (selectedAgents.value.length === 0) {
      errors.agents = 'Selecciona al menos un agente para el consejo.'
      return false
    }
    errors.agents = ''
  }
  return true
}

function focusStepInput() {
  nextTick(() => {
    if (currentStep.value === 0 && titleInput.value) {
      titleInput.value.focus()
    } else if (currentStep.value === 2 && iterationsInput.value) {
      iterationsInput.value.focus()
    }
  })
}

function goNext() {
  if (!validateStep(currentStep.value)) return
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    focusStepInput()
  }
}

function goBack() {
  if (currentStep.value > 0) {
    currentStep.value--
    focusStepInput()
  }
}

function handleSubmit() {
  if (!canSubmit.value) return

  const idea = {
    id: crypto.randomUUID(),
    title: title.value.trim(),
    prompt: prompt.value.trim(),
    agents: [...selectedAgents.value],
    maxIterations: maxIterations.value,
    model: selectedModel.value,
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

.wizard-shell {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-indicator {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-1);
  border-radius: 1rem;
  transition: width 0.35s ease;
}

.progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
}

.progress-label {
  color: var(--text-secondary);
}

.progress-status {
  color: var(--accent-soft);
}

.wizard-form {
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
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
  min-height: 140px;
  font-family: inherit;
}

.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.input-error {
  border-color: #ef4444;
}

.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.field-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.field-hint kbd {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
}

/* Council step */
.council-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.council-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.council-clear {
  background: transparent;
  border: none;
  color: var(--accent-soft);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 0.2s;
}

.council-clear:hover {
  color: var(--accent-glow);
}

.council-clear:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.council-fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.council-legend {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.council-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.council-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
  user-select: none;
}

.council-card:hover {
  border-color: var(--border-glow);
  background: var(--bg-card-hover);
}

.council-card:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.council-card.selected {
  border-color: var(--accent);
  background: var(--gradient-card);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.council-card.selected .council-check {
  opacity: 1;
  transform: scale(1);
}

.council-checkbox {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.council-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: color 0.2s, border-color 0.2s;
  flex-shrink: 0;
}

.council-card.selected .council-illustration {
  color: var(--accent-soft);
  border-color: var(--accent);
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

.council-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.council-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.council-question {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.council-check {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--gradient-1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}

/* Iterations step */
.iterations-presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-chip {
  padding: 0.4rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}

.preset-chip:hover {
  border-color: var(--border-glow);
  color: var(--text-primary);
}

.preset-chip.selected {
  border-color: var(--accent);
  background: var(--gradient-card);
  color: var(--text-primary);
}

.preset-chip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Model step */
.model-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  text-align: left;
  width: 100%;
}

.model-option:hover {
  border-color: var(--border-glow);
  background: var(--bg-card-hover);
}

.model-option.selected {
  border-color: var(--accent);
  background: var(--gradient-card);
}

.model-option:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.model-option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-glow);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s;
}

.model-option.selected .model-option-radio {
  border-color: var(--accent);
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s;
}

.radio-dot.checked {
  background: var(--accent);
}

.model-option-body {
  flex: 1;
  min-width: 0;
}

.model-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.model-option-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.model-option-price {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent-soft);
  white-space: nowrap;
}

.model-option-detail {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Summary step */
.summary-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
}

.summary-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.summary-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.summary-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 0.95rem;
  color: var(--text-primary);
  margin: 0;
}

.summary-prompt {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

/* Actions */
.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.actions-spacer {
  flex: 1;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.65rem 1.25rem;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.btn-secondary:hover {
  border-color: var(--border-glow);
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient-1);
  border: none;
  color: white;
  padding: 0.65rem 1.5rem;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.25s, opacity 0.2s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.55);
  transform: translateY(-1px);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--accent-glow);
  outline-offset: 2px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@media (max-width: 640px) {
  .form-section {
    padding: 1.5rem 1.25rem;
  }

  .council-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-wrap: wrap;
  }

  .actions-spacer {
    display: none;
  }
}
</style>
