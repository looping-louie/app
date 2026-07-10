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

        <TransitionGroup
          v-else
          name="provider"
          tag="ul"
          class="stacked-list"
          role="list"
        >
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

              <template v-if="configuringId === provider.id">
                <div class="config-form" @keydown.enter.prevent="saveProvider(provider.id)">
                  <div v-if="provider.id === 'ollama'" class="form-row">
                    <label :for="`base-url-${provider.id}`" class="form-label">Base URL</label>
                    <input
                      :id="`base-url-${provider.id}`"
                      v-model="configForms[provider.id].baseUrl"
                      type="url"
                      class="form-input"
                      placeholder="http://localhost:11434"
                      :disabled="savingId === provider.id"
                      autocomplete="url"
                    />
                  </div>

                  <div v-if="provider.id === 'ollama' || provider.requiresApiKey" class="form-row">
                    <label :for="`api-key-${provider.id}`" class="form-label">
                      {{ provider.id === 'ollama' ? 'Password (optional)' : 'API key' }}
                    </label>
                    <input
                      :id="`api-key-${provider.id}`"
                      v-model="configForms[provider.id].apiKey"
                      :type="provider.id === 'ollama' ? 'password' : 'password'"
                      class="form-input"
                      :placeholder="provider.id === 'ollama' ? 'Optional password' : 'Enter your API key'"
                      :disabled="savingId === provider.id"
                      :autocomplete="provider.id === 'ollama' ? 'current-password' : 'off'"
                    />
                  </div>

                  <p
                    v-if="configErrors[provider.id]"
                    class="config-error"
                    role="alert"
                  >
                    {{ configErrors[provider.id] }}
                  </p>

                  <div class="config-actions">
                    <button
                      type="button"
                      class="btn-save"
                      :disabled="savingId === provider.id"
                      @click="saveProvider(provider.id)"
                    >
                      <span v-if="savingId === provider.id" class="btn-spinner" aria-hidden="true"></span>
                      <span>{{ savingId === provider.id ? 'Saving…' : 'Save key' }}</span>
                    </button>
                    <button
                      type="button"
                      class="btn-cancel"
                      :disabled="savingId === provider.id"
                      @click="cancelConfig(provider.id)"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </template>

              <template v-else>
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
              </template>
            </div>

            <div
              class="toggle-wrapper"
              role="switch"
              :aria-checked="provider.enabled ? 'true' : 'false'"
              :aria-label="`Disable ${provider.name}`"
              :aria-disabled="togglingId === provider.id"
              :tabindex="togglingId === provider.id ? -1 : 0"
              @click="toggleProvider(provider.id)"
              @keydown.enter.prevent="toggleProvider(provider.id)"
              @keydown.space.prevent="toggleProvider(provider.id)"
            >
              <span class="toggle" :class="{ on: provider.enabled }">
                <span class="toggle-track">
                  <span class="toggle-thumb"></span>
                </span>
              </span>
            </div>
          </li>
        </TransitionGroup>
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

        <TransitionGroup
          v-else
          name="provider"
          tag="ul"
          class="stacked-list"
          role="list"
        >
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
            <div
              class="toggle-wrapper"
              role="switch"
              :aria-checked="provider.enabled ? 'true' : 'false'"
              :aria-label="`Enable ${provider.name}`"
              :aria-disabled="togglingId === provider.id"
              :tabindex="togglingId === provider.id ? -1 : 0"
              @click="toggleProvider(provider.id)"
              @keydown.enter.prevent="toggleProvider(provider.id)"
              @keydown.space.prevent="toggleProvider(provider.id)"
            >
              <span class="toggle" :class="{ on: provider.enabled }">
                <span class="toggle-track">
                  <span class="toggle-thumb"></span>
                </span>
              </span>
            </div>
          </li>
        </TransitionGroup>
      </template>
    </section>

    <Teleport to="body">
      <div class="toast-container" aria-live="polite" role="status">
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            class="toast"
            :class="`toast-${toast.type}`"
            role="alert"
          >
            <span class="toast-icon" aria-hidden="true">{{ toast.type === 'success' ? '✓' : '⚠' }}</span>
            <span class="toast-message">{{ toast.message }}</span>
            <button
              type="button"
              class="toast-close"
              aria-label="Dismiss notification"
              @click="dismissToast(toast.id)"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useProviders } from '~/composables/useProviders'
import { useToasts } from '~/composables/useToasts'

const { providers, pending, error, fetchProviders, saveCredential, setEnabled } = useProviders()
const { toasts, pushToast, dismissToast } = useToasts()

await useAsyncData('providers', () => fetchProviders())

const configuringId = ref<string | null>(null)
const savingId = ref<string | null>(null)
const configForms = reactive<Record<string, { apiKey: string; baseUrl: string }>>({})
const configErrors = reactive<Record<string, string>>({})

const enabledProviders = computed(() =>
  providers.value.filter((p) => p.enabled)
)

const availableProviders = computed(() =>
  providers.value.filter((p) => !p.enabled)
)

const togglingId = ref<string | null>(null)
async function toggleProvider(id: string) {
  if (togglingId.value === id) return

  const provider = providers.value.find((p) => p.id === id)
  if (!provider) return

  if (provider.enabled) {
    await disableProvider(id)
  } else {
    await enableProvider(id)
  }
}

async function disableProvider(id: string) {
  const provider = providers.value.find((p) => p.id === id)
  if (!provider) return

  togglingId.value = id
  const previousEnabled = provider.enabled
  provider.enabled = false
  configuringId.value = null
  delete configForms[id]
  delete configErrors[id]

  try {
    await setEnabled(id, false)
    pushToast(`${provider.name} disabled. Your stored credential has been preserved.`)
  } catch (err) {
    provider.enabled = previousEnabled
    const message = err instanceof Error && err.message
      ? err.message
      : `Unable to disable ${provider.name}. Please try again.`
    pushToast(message, 'error')
  } finally {
    togglingId.value = null
  }
}

async function enableProvider(id: string) {
  const provider = providers.value.find((p) => p.id === id)
  if (!provider) return

  togglingId.value = id

  try {
    const result = await setEnabled(id, true)

    provider.enabled = true

    if (result.has_credential) {
      if (result.key_trimmed) {
        provider.keyTrimmed = result.key_trimmed
      }
      if (typeof result.model_count === 'number') {
        provider.modelCount = result.model_count
      }
      configuringId.value = null
      delete configForms[id]
      delete configErrors[id]
      pushToast(`${provider.name} enabled. ${result.model_count ?? provider.modelCount} models available.`)
    } else {
      configuringId.value = id
      configForms[id] = { apiKey: '', baseUrl: provider.baseUrl || '' }
      configErrors[id] = ''
      pushToast(`${provider.name} enabled. Enter your API key to start using it.`)
    }
  } catch (err) {
    const message = err instanceof Error && err.message
      ? err.message
      : `Unable to enable ${provider.name}. Please try again.`
    pushToast(message, 'error')
  } finally {
    togglingId.value = null
  }
}

function cancelConfig(id: string) {
  const provider = providers.value.find((p) => p.id === id)
  if (provider) {
    provider.enabled = false
  }
  configuringId.value = null
  delete configForms[id]
  delete configErrors[id]
}

async function saveProvider(id: string) {
  if (savingId.value === id) return

  const provider = providers.value.find((p) => p.id === id)
  if (!provider) return

  const form = configForms[id]
  if (!form) return

  if (id !== 'ollama' && !form.apiKey.trim()) {
    configErrors[id] = 'API key is required.'
    return
  }

  if (id === 'ollama' && !form.baseUrl.trim()) {
    configErrors[id] = 'Base URL is required.'
    return
  }

  savingId.value = id
  configErrors[id] = ''

  try {
    const body: Record<string, string> = {}
    if (id === 'ollama') {
      body.base_url = form.baseUrl.trim()
      if (form.apiKey.trim()) {
        body.api_key = form.apiKey.trim()
      }
    } else {
      body.api_key = form.apiKey.trim()
    }

    const result = await saveCredential(id, body)

    provider.keyTrimmed = result.key_trimmed
    provider.modelCount = result.model_count
    if (body.base_url) {
      provider.baseUrl = body.base_url
    }

    form.apiKey = ''
    configuringId.value = null
    delete configForms[id]

    pushToast(`API key saved successfully. You have unlocked ${result.model_count} models.`)
  } catch (err) {
    provider.enabled = false
    configuringId.value = null
    delete configForms[id]

    const message = err instanceof Error && err.message
      ? err.message
      : 'Unable to save credentials. Please try again.'
    configErrors[id] = message
    pushToast(message, 'error')
  } finally {
    savingId.value = null
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

.config-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 0.88rem;
  font-family: var(--font-mono, monospace);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-error {
  font-size: 0.82rem;
  color: #ef4444;
  margin: 0;
}

.config-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient-1);
  border: none;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: box-shadow 0.2s, opacity 0.2s;
}

.btn-save:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--text-primary);
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-wrapper {
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.toggle-wrapper:focus-visible {
  outline: 2px solid var(--accent-glow);
  outline-offset: 2px;
}

.toggle {
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
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

.provider-enter-active,
.provider-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.provider-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.provider-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.provider-move {
  transition: transform 0.25s ease;
}

@media (prefers-reduced-motion: reduce) {
  .provider-enter-active,
  .provider-leave-active,
  .provider-move {
    transition: none;
  }

  .provider-enter-from,
  .provider-leave-to {
    transform: none;
  }

  .spinner,
  .btn-spinner {
    animation-duration: 0.01ms;
  }
}

.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  background: var(--bg-card, #1a1a28);
  border: 1px solid var(--border, #2a2a3a);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  min-width: 280px;
  max-width: 420px;
}

.toast-success {
  border-color: rgba(52, 211, 153, 0.3);
}

.toast-error {
  border-color: rgba(239, 68, 68, 0.3);
}

.toast-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  color: #34d399;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-message {
  flex: 1;
  font-size: 0.88rem;
  color: var(--text-primary, #e5e5e5);
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--text-muted, #7a7a90);
  cursor: pointer;
  padding: 0.15rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--text-primary, #e5e5e5);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}

@media (max-width: 640px) {
  .provider-card {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .provider-body {
    flex: 1 1 calc(100% - 64px);
  }

  .toggle-wrapper {
    align-self: flex-end;
  }

  .toast-container {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  .toast {
    min-width: 0;
    max-width: none;
  }
}
</style>
