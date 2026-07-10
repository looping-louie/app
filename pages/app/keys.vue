<template>
  <div class="keys-page">
    <div class="page-header">
      <h1>Model providers</h1>
      <p class="page-description">Connect model providers securely so your organisation can use their models in runs, meetings and loops. Credentials are encrypted by the API and are never returned to the browser after they are saved.</p>
    </div>

    <section class="providers-section" aria-labelledby="enabled-heading">
      <h2 id="enabled-heading" class="section-heading">Enabled providers</h2>

      <div v-if="enabledProviders.length === 0" class="empty-state">
        <span class="empty-icon">🔑</span>
        <p>You have not enabled any providers yet. Enable the providers you want from the list below.</p>
      </div>

      <ul v-else class="stacked-list" role="list">
        <li
          v-for="provider in enabledProviders"
          :key="provider.id"
          class="provider-card"
        >
          <img
            :src="provider.logo"
            :alt="`${provider.name} logo`"
            class="provider-logo"
            width="48"
            height="48"
            loading="lazy"
          />
          <div class="provider-body">
            <h3 class="provider-name">{{ provider.name }}</h3>
            <p class="provider-description">{{ provider.description }}</p>
          </div>
          <button
            type="button"
            class="toggle"
            :class="{ on: true }"
            :aria-pressed="true"
            :aria-label="`Disable ${provider.name}`"
            @click="toggleProvider(provider.id)"
          >
            <span class="toggle-track">
              <span class="toggle-thumb"></span>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section class="providers-section" aria-labelledby="available-heading">
      <h2 id="available-heading" class="section-heading">Available providers</h2>

      <ul class="stacked-list" role="list">
        <li
          v-for="provider in availableProviders"
          :key="provider.id"
          class="provider-card"
        >
          <img
            :src="provider.logo"
            :alt="`${provider.name} logo`"
            class="provider-logo"
            width="48"
            height="48"
            loading="lazy"
          />
          <div class="provider-body">
            <h3 class="provider-name">{{ provider.name }}</h3>
            <p class="provider-description">{{ provider.description }}</p>
          </div>
          <button
            type="button"
            class="toggle"
            :class="{ on: false }"
            :aria-pressed="false"
            :aria-label="`Enable ${provider.name}`"
            @click="toggleProvider(provider.id)"
          >
            <span class="toggle-track">
              <span class="toggle-thumb"></span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app'
})

useHead({
  title: 'Settings · Looping Louie'
})

const providers = ref([
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Access Claude models for reasoning, coding and long-context review.',
    logo: '/images/providers/anthropic.jpeg'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    description: 'Access NVIDIA-hosted open models through the NVIDIA NIM API.',
    logo: '/images/providers/nvidia.jpeg'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Connect local or self-hosted open-source models through an Ollama endpoint.',
    logo: '/images/providers/ollama.jpeg'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Access GPT models for generation, reasoning and specialised reviews.',
    logo: '/images/providers/openai.jpeg'
  },
  {
    id: 'together',
    name: 'Together',
    description: 'Access a broad catalogue of hosted open-source models.',
    logo: '/images/providers/together.jpeg'
  }
])

const enabledIds = ref(new Set())

const enabledProviders = computed(() =>
  providers.value.filter((p) => enabledIds.value.has(p.id))
)

const availableProviders = computed(() =>
  providers.value.filter((p) => !enabledIds.value.has(p.id))
)

function toggleProvider(id) {
  const next = new Set(enabledIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  enabledIds.value = next
}
</script>

<style scoped>
.keys-page {
  max-width: 900px;
}

.page-header {
  margin-bottom: 2.5rem;
}

.keys-page h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  color: var(--text-secondary);
  max-width: 640px;
  line-height: 1.6;
}

.providers-section {
  margin-bottom: 2.5rem;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
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
  max-width: 420px;
  margin: 0 auto;
  line-height: 1.6;
}

.stacked-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.provider-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s;
}

.provider-card:last-child {
  border-bottom: none;
}

.provider-card:hover {
  background: var(--bg-card-hover);
}

.provider-logo {
  width: 48px;
  height: 48px;
  border-radius: 0.625rem;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.provider-body {
  flex: 1;
  min-width: 0;
}

.provider-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.provider-description {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.toggle {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.toggle:focus-visible {
  outline: 2px solid var(--accent-glow);
  outline-offset: 4px;
  border-radius: 0.75rem;
}

.toggle-track {
  display: inline-block;
  width: 44px;
  height: 24px;
  border-radius: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  position: relative;
  transition: background 0.2s, border-color 0.2s;
}

.toggle.on .toggle-track {
  background: var(--gradient-1);
  border-color: transparent;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: transform 0.2s, background 0.2s;
}

.toggle.on .toggle-thumb {
  transform: translateX(20px);
  background: white;
}

@media (max-width: 640px) {
  .provider-card {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .provider-body {
    flex: 1 1 calc(100% - 64px);
  }

  .toggle {
    align-self: flex-end;
  }
}
</style>
