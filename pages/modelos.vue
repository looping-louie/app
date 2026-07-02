<template>
  <div class="modelos-page">
    <div class="modelos-header">
      <h1>Modelos</h1>
      <p class="modelos-subtitle">Supported models and pricing per 1M tokens</p>
      <div class="search-wrapper">
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="Search models..."
          aria-label="Search models"
        />
      </div>
    </div>

    <div class="model-grid">
      <div
        v-for="model in models"
        :key="model.name"
        class="model-card"
        :class="{ hidden: !matches(model.name) }"
      >
        <div class="model-logo">{{ model.name.charAt(0) }}</div>
        <h3 class="model-name">{{ model.name }}</h3>
        <div class="model-prices">
          <div class="price-row">
            <span class="price-label">Input</span>
            <span class="price-value">${{ model.input.toFixed(2) }}</span>
          </div>
          <div v-if="model.cached !== null" class="price-row">
            <span class="price-label">Cached</span>
            <span class="price-value">${{ model.cached.toFixed(2) }}</span>
          </div>
          <div class="price-row">
            <span class="price-label">Output</span>
            <span class="price-value">${{ model.output.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Looping Louie | Modelos',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' }
  ]
})

const search = ref('')

const models = [
  { name: 'DeepSeek V4 Pro', input: 1.74, cached: 0.20, output: 3.48 },
  { name: 'MiniMax M3', input: 0.30, cached: 0.06, output: 1.20 },
  { name: 'Kimi K2.7 Code', input: 0.95, cached: 0.19, output: 4.00 },
  { name: 'GLM-5.2', input: 1.40, cached: 0.26, output: 4.40 },
  { name: 'LFM2 24B A2B', input: 0.03, cached: null, output: 0.12 },
  { name: 'Gemma 4 31B', input: 0.39, cached: null, output: 0.97 },
  { name: 'NVIDIA Nemotron 3 Ultra', input: 0.60, cached: 0.20, output: 3.60 },
  { name: 'Qwen3.7-Plus', input: 0.32, cached: null, output: 1.28 },
  { name: 'Kimi K2.6', input: 1.20, cached: 0.20, output: 4.50 },
  { name: 'Qwen3.7-Max', input: 1.25, cached: 0.13, output: 3.75 },
  { name: 'gpt-oss-120B', input: 0.15, cached: null, output: 0.60 },
  { name: 'Qwen3.5-397B-A17B', input: 0.60, cached: 0.35, output: 3.60 },
  { name: 'Qwen3.5 9B', input: 0.17, cached: null, output: 0.25 },
  { name: 'Gemma-4-31B-it-Pearl', input: 0.28, cached: null, output: 0.86 },
  { name: 'Cogito v2.1 671B', input: 1.25, cached: null, output: 1.25 },
  { name: 'RnJ-1 Instruct', input: 0.15, cached: null, output: 0.15 },
  { name: 'Llama 3.3 70B', input: 1.04, cached: null, output: 1.04 },
  { name: 'Gemma 3n E4B Instruct', input: 0.06, cached: null, output: 0.12 },
  { name: 'gpt-oss-20B', input: 0.05, cached: null, output: 0.20 },
  { name: 'Qwen3 235B A22B FP8 Throughput', input: 0.20, cached: null, output: 0.60 },
  { name: 'MiniMax M2.5', input: 0.30, cached: 0.06, output: 1.20 },
  { name: 'GLM-5.1', input: 1.40, cached: 0.26, output: 4.40 },
  { name: 'MiniMax M2.7', input: 0.30, cached: 0.06, output: 1.20 },
  { name: 'Qwen3.6-Plus', input: 0.50, cached: null, output: 3.00 },
  { name: 'Qwen2.5 7B Instruct Turbo', input: 0.30, cached: null, output: 0.30 },
  { name: 'Llama 3 8B Instruct Lite', input: 0.14, cached: null, output: 0.14 },
  { name: 'Qwen3 235B A22B Instruct 2507 FP8 Throughput', input: 0.20, cached: null, output: 0.60 }
]

function matches(name) {
  return name.toLowerCase().includes(search.value.toLowerCase())
}
</script>

<style scoped>
.modelos-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 2rem;
  position: relative;
  z-index: 2;
}

.modelos-header {
  text-align: center;
  margin-bottom: 3rem;
}

.modelos-header h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(to right, #f0f0f5, #c084fc, #a78bfa);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.modelos-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.search-wrapper {
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 0.8rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-glow);
  border-radius: 2rem;
  color: var(--text-primary);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 15px rgba(124, 58, 237, 0.25);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.model-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.8rem 1.5rem;
  transition: opacity 0.4s ease, transform 0.4s ease, border-color 0.3s, box-shadow 0.3s;
  box-shadow: var(--shadow-card);
  opacity: 1;
  transform: scale(1);
}

.model-card:hover {
  border-color: var(--accent-soft);
  box-shadow: 0 12px 30px rgba(124, 58, 237, 0.2);
}

.model-card.hidden {
  opacity: 0;
  transform: scale(0.9);
  pointer-events: none;
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  margin: 0;
  border: 0;
  overflow: hidden;
}

.model-logo {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: var(--gradient-1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.model-name {
  font-size: 1.2rem;
  font-weight: 650;
  margin-bottom: 1rem;
  color: var(--text-primary);
  line-height: 1.3;
  min-height: 2.6rem;
}

.model-prices {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--border);
}

.price-row:last-child {
  border-bottom: none;
}

.price-label {
  color: var(--text-muted);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-value {
  color: var(--accent-soft);
  font-weight: 600;
  font-size: 1rem;
  font-family: var(--font-mono);
}

@media (max-width: 600px) {
  .modelos-page {
    padding: 2rem 1rem;
  }
}
</style>
