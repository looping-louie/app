<template>
  <div class="pipeline-new-page">
    <div class="page-header">
      <NuxtLink to="/app/pipelines" class="back-link">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M12.78 5.22a.75.75 0 0 0-1.06 0L6.47 10.47a.75.75 0 0 0 0 1.06l5.25 5.25a.75.75 0 1 0 1.06-1.06L8.06 11l4.72-4.72a.75.75 0 0 0 0-1.06Z"/></svg>
        Volver a Pipelines
      </NuxtLink>
      <h1>Nuevo pipeline</h1>
      <p class="page-description">Describe tu pipeline y configura un equipo de agentes para refinarlo antes de convertirlo en una especificación.</p>
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
            <p class="section-helper">Describe el pipeline que quieres discutir. Cuanto más contexto aportes —objetivos, restricciones y público objetivo— mejor podrán los agentes entenderlo y refinarlo.</p>
          </div>

          <div class="form-group">
            <label for="pipeline-title" class="form-label">Título</label>
            <input
              id="pipeline-title"
              ref="titleInput"
              v-model="title"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.title }"
              :aria-invalid="errors.title ? 'true' : null"
              :aria-describedby="errors.title ? 'pipeline-title-error' : null"
              placeholder="Ej: Sistema de feedback para revisiones de código"
              @input="clearError('title')"
            />
            <p
              v-if="errors.title"
              id="pipeline-title-error"
              class="field-error"
              role="alert"
            >
              {{ errors.title }}
            </p>
          </div>

          <div class="form-group">
            <label for="pipeline-prompt" class="form-label">Prompt</label>
            <textarea
              id="pipeline-prompt"
              ref="promptInput"
              v-model="prompt"
              class="form-textarea"
              :class="{ 'input-error': errors.prompt }"
              :aria-invalid="errors.prompt ? 'true' : null"
              :aria-describedby="errors.prompt ? 'pipeline-prompt-error' : null"
              rows="8"
              placeholder="Describe tu pipeline en detalle: qué problema resuelve, qué debe incluir, qué restricciones tienes..."
              @keydown.meta.enter.prevent="goNext"
              @keydown.ctrl.enter.prevent="goNext"
              @input="clearError('prompt')"
            ></textarea>
            <p
              v-if="errors.prompt"
              id="pipeline-prompt-error"
              class="field-error"
              role="alert"
            >
              {{ errors.prompt }}
            </p>
            <p v-else class="field-hint">Pulsa <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>Enter</kbd> para continuar.</p>
          </div>
        </section>

        <!-- Step 1: Agent team -->
        <section
          v-show="currentStep === 1"
          class="form-section"
          aria-labelledby="step-1-title"
        >
          <div class="section-header">
            <h2 id="step-1-title" class="section-title">Build your agent team</h2>
            <p class="section-helper">Selecciona los agentes que discutirán el pipeline. Cada uno aportará una perspectiva distinta — crítica, técnica, de producto — y juntos refinarán el resultado antes de convertirlo en una especificación.</p>
          </div>

          <div class="agent-team-summary" aria-live="polite">
            <span class="agent-team-count">{{ selectedAgents.length }} seleccionado{{ selectedAgents.length === 1 ? '' : 's' }}</span>
            <button
              v-if="selectedAgents.length > 0"
              type="button"
              class="agent-team-clear"
              @click="clearAgents"
            >
              Limpiar selección
            </button>
          </div>

          <fieldset class="agent-team-fieldset">
            <legend class="agent-team-legend">Agentes disponibles</legend>
            <div class="agent-team-grid">
              <label
                v-for="agent in availableAgents"
                :key="agent.name"
                class="agent-team-card"
                :class="{ selected: selectedAgents.includes(agent.name) }"
              >
                <input
                  type="checkbox"
                  class="agent-team-checkbox"
                  :checked="selectedAgents.includes(agent.name)"
                  :aria-label="agent.name"
                  @change="toggleAgent(agent.name)"
                />
                <span class="agent-team-illustration" aria-hidden="true">
                  <span class="illustration-icon" v-html="agent.icon"></span>
                </span>
                <span class="agent-team-body">
                  <span class="agent-team-name">{{ agent.name }}</span>
                  <span class="agent-team-question">{{ agent.question }}</span>
                </span>
                <span class="agent-team-check" aria-hidden="true">
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
            <p class="section-helper">Define cuántas veces puede el equipo refinar el pipeline antes de entregar el resultado. Más iteraciones permiten mayor calidad, pero consumen más tokens.</p>
          </div>

          <div
            ref="keypadRef"
            class="keypad"
            role="radiogroup"
            aria-labelledby="step-2-title"
            tabindex="0"
            @keydown="onKeypadKeydown"
          >
            <button
              v-for="value in keypadValues"
              :key="value"
              type="button"
              class="keypad-key"
              :class="{ selected: maxIterations === value }"
              role="radio"
              :aria-checked="maxIterations === value ? 'true' : 'false'"
              :aria-label="`${value} iteraciones`"
              @click="selectIterations(value)"
            >
              <span class="keypad-number">{{ value }}</span>
            </button>
          </div>

          <p class="field-hint">Usa las teclas <kbd>1</kbd>–<kbd>9</kbd>, las flechas o el ratón para elegir. El valor por defecto es 3.</p>
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
            <p class="section-helper">Revisa la configuración del equipo antes de ejecutarlo. Puedes volver atrás para ajustar cualquier respuesta.</p>
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
              <dt class="summary-label">Equipo</dt>
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

          <NuxtLink to="/app/pipelines" class="btn-secondary">Cancelar</NuxtLink>

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
            Run pipeline
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
  title: 'Nuevo pipeline · Looping Louie'
})

const router = useRouter()

const steps = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'agent-team', label: 'Equipo' },
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
const keypadRef = ref(null)

const keypadValues = [1, 2, 3, 4, 5, 6, 7, 8, 9]

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
    question: '¿Por qué es un mal pipeline?',
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
      return maxIterations.value >= 1 && maxIterations.value <= 9
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
  maxIterations.value <= 9 &&
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

function selectIterations(value) {
  maxIterations.value = value
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
      errors.agents = 'Selecciona al menos un agente para el equipo.'
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
    } else if (currentStep.value === 2 && keypadRef.value) {
      keypadRef.value.focus()
    }
  })
}

function onKeypadKeydown(event) {
  const key = event.key

  if (key >= '1' && key <= '9') {
    event.preventDefault()
    maxIterations.value = Number(key)
    return
  }

  const currentIndex = keypadValues.indexOf(maxIterations.value)
  let nextIndex = currentIndex

  if (key === 'ArrowRight') {
    event.preventDefault()
    nextIndex = currentIndex + 1
    if (nextIndex > 8) nextIndex = 0
  } else if (key === 'ArrowLeft') {
    event.preventDefault()
    nextIndex = currentIndex - 1
    if (nextIndex < 0) nextIndex = 8
  } else if (key === 'ArrowDown') {
    event.preventDefault()
    nextIndex = currentIndex + 3
    if (nextIndex > 8) nextIndex = nextIndex - 9
  } else if (key === 'ArrowUp') {
    event.preventDefault()
    nextIndex = currentIndex - 3
    if (nextIndex < 0) nextIndex = nextIndex + 9
  } else if (key === 'Home') {
    event.preventDefault()
    nextIndex = 0
  } else if (key === 'End') {
    event.preventDefault()
    nextIndex = 8
  } else {
    return
  }

  maxIterations.value = keypadValues[nextIndex]
}

function onWindowKeydown(event) {
  if (currentStep.value !== 2) return

  const target = event.target
  const tag = target && target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
    return
  }

  const key = event.key
  if (key >= '1' && key <= '9') {
    event.preventDefault()
    maxIterations.value = Number(key)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})

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

  const pipeline = {
    id: crypto.randomUUID(),
    title: title.value.trim(),
    prompt: prompt.value.trim(),
    user: 'Tú',
    agents: [...selectedAgents.value],
    status: 'pending',
    messageCount: 0,
    maxIterations: maxIterations.value,
    model: selectedModel.value,
    createdAt: new Date().toISOString()
  }

  const stored = JSON.parse(
    localStorage.getItem('looping-louie:pipelines')
      || localStorage.getItem('looping-louie:ideas')
      || '[]'
  )
  stored.unshift(pipeline)
  localStorage.setItem('looping-louie:pipelines', JSON.stringify(stored))

  router.push('/app/pipelines')
}
</script>

<style scoped>
.pipeline-new-page {
  max-width: 720px;
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
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text-primary);
}

.pipeline-new-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
}

.wizard-shell {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.progress-indicator {
  margin-bottom: 2rem;
}

.progress-track {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-1);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.6rem;
}

.progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-status {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.wizard-form {
  display: flex;
  flex-direction: column;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.4rem;
}

.section-helper {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-input,
.form-textarea {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.form-input.input-error,
.form-textarea.input-error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.field-error {
  font-size: 0.8rem;
  color: #ef4444;
  font-weight: 500;
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.field-hint kbd {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
}

/* Keypad */
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  max-width: 320px;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  outline: none;
}

.keypad:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.keypad-key {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.keypad-key:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-glow);
}

.keypad-key:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

.keypad-key:active {
  transform: scale(0.96);
}

.keypad-key.selected {
  background: var(--gradient-1);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.3);
}

.keypad-number {
  line-height: 1;
}

@media (max-width: 480px) {
  .keypad {
    max-width: 100%;
  }

  .keypad-key {
    height: 56px;
    font-size: 1.35rem;
  }
}

/* Agent team */
.agent-team-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.agent-team-count {
  font-weight: 600;
}

.agent-team-clear {
  background: transparent;
  border: none;
  color: var(--accent-soft);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.agent-team-clear:hover {
  color: var(--accent-glow);
}

.agent-team-fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.agent-team-legend {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding: 0;
}

.agent-team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.agent-team-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
}

.agent-team-card:hover {
  border-color: var(--border-glow);
  background: var(--bg-card-hover);
}

.agent-team-card.selected {
  border-color: var(--accent);
  background: var(--gradient-card);
}

.agent-team-checkbox {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.agent-team-card:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.agent-team-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border);
  flex-shrink: 0;
  color: var(--accent-soft);
}

.agent-team-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.agent-team-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.agent-team-question {
  font-size: 0.75rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-team-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.agent-team-card.selected .agent-team-check {
  opacity: 1;
}

/* Model list */
.model-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, background 0.2s;
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
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
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
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.model-option-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.model-option-price {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  white-space: nowrap;
}

.model-option-detail {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Summary */
.summary-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
}

.summary-row {
  display: flex;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.summary-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  width: 140px;
  flex-shrink: 0;
}

.summary-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.summary-prompt {
  white-space: pre-wrap;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

/* Form actions */
.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.actions-spacer {
  flex: 1;
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
  cursor: pointer;
  text-decoration: none;
  transition: box-shadow 0.25s, transform 0.25s, opacity 0.2s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.55);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.btn-secondary:hover {
  border-color: var(--border-glow);
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

@media (max-width: 640px) {
  .wizard-shell {
    padding: 1.25rem;
  }

  .form-actions {
    flex-wrap: wrap;
  }

  .actions-spacer {
    display: none;
  }

  .summary-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .summary-label {
    width: auto;
  }
}
</style>
