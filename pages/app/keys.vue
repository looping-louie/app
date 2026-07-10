<template>
  <div class="keys-page">
    <div class="page-header">
      <h1>Model providers</h1>
      <p class="page-description">Connect model providers securely so your organisation can use their models in runs, meetings and loops. Credentials are encrypted by the API and are never returned to the browser after they are saved.</p>
    </div>

    <section class="providers-section" aria-labelledby="enabled-heading">
      <h2 id="enabled-heading" class="section-heading">Enabled providers</h2>

      <div v-if="pending" class="state-card" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <p class="state-text">Loading providers…</p>
      </div>

      <div v-else-if="error" class="state-card state-error" role="alert">
        <span class="state-icon">⚠</span>
        <p class="state-text">{{ error }}</p>
        <button type="button" class="btn-retry" @click="fetchProviders">Retry</button>
      </div>

      <template v-else>
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
              <dl class="provider-meta">
                <div v-if="provider.keyTrimmed" class="meta-row">
                  <dt>API key</dt>
                  <dd><code>{{ provider.keyTrimmed }}</code></dd>
                </div>
                <div v-if="provider.baseUrl" class="meta-row">
                  <dt>Base URL</dt>
                  <dd><code>{{ provider.baseUrl }}</code></dd>
                </div>
                <div class="meta-row">
                  <dt>Models</dt>
                  <dd>{{ provider.modelCount }}</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              class="toggle"
              :class="{ on: provider.enabled }"
              :aria-pressed="provider.enabled"
              :aria-label="`Disable ${provider.name}`"
              @click="toggleProvider(provider.id)"
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
            </button>
          </li>
        </ul>
      </template>
    </section>

    <section class="providers-section" aria-labelledby="available-heading">
      <h2 id="available-heading" class="section-heading">Available providers</h2>

      <div v-if="pending" class="state-card" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <p class="state-text">Loading providers…</p>
      </div>

      <div v-else-if="error" class="state-card state-error" role="alert">
        <span class="state-icon">⚠</span>
        <p class="state-text">{{ error }}</p>
        <button type="button" class="btn-retry" @click="fetchProviders">Retry</button>
      </div>

      <template v-else>
        <div v-if="availableProviders.length === 0" class="empty-state">
          <span class="empty-icon">✓</span>
          <p>All available providers are enabled.</p>
        </div>

        <ul v-else class="stacked-list" role="list">
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
              <dl class="provider-meta">
                <div v-if="provider.requiresApiKey" class="meta-row">
                  <dt>API key</dt>
                  <dd>Required</dd>
                </div>
                <div v-if="provider.baseUrl" class="meta-row">
                  <dt>Base URL</dt>
                  <dd><code>{{ provider.baseUrl }}</code></dd>
                </div>
                <div class="meta-row">
                  <dt>Models</dt>
                  <dd>{{ provider.modelCount }}</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              class="toggle"
              :class="{ on: provider.enabled }"
              :aria-pressed="provider.enabled"
              :aria-label="`Enable ${provider.name}`"
              @click="toggleProvider(provider.id)"
            >
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
            </button>
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useProviders } from '~/composables/useProviders'

const { providers, pending, error, fetchProviders } = useProviders()

await useAsyncData('providers', () => fetchProviders())

const enabledProviders = computed(() =>
  providers.value.filter((p) => p.enabled)
)

const availableProviders = computed(() =>
  providers.value.filter((p) => !p.enabled)
)

function toggleProvider(id: string) {
  const provider = providers.value.find((p) => p.id === id)
  if (provider) {
    provider.enabled = !provider.enabled
  }
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

.state-card {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.state-card.state-error {
  border-color: rgba(239, 68, 68, 0.3);
}

.state-icon {
  font-size: 2rem;
  color: #ef4444;
}

.state-text {
  color: var(--text-secondary);
  margin: 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-retry {
  background: var(--gradient-1);
  border: none;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.btn-retry:hover {
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
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
  align-items: flex-start;
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
  margin-bottom: 0.5rem;
}

.provider-meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
}

.meta-row dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.meta-row dd {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.meta-row dd code {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  color: var(--text-primary);
}

.toggle {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
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
