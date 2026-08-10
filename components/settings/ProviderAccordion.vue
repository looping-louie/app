<script setup lang="ts">
import type { Provider } from '~/composables/useProviders'
import UiButton from '~/components/ui/Button.vue'
import UiToggle from '~/components/ui/Toggle.vue'

const props = withDefaults(defineProps<{
  providers: Provider[]
  togglingId?: string | null
  savingId?: string | null
}>(), {
  togglingId: null,
  savingId: null,
})

const emit = defineEmits<{
  toggle: [provider: Provider, enabled: boolean]
  save: [provider: Provider, apiKey: string]
}>()

const instanceId = useId().replaceAll(':', '')
const openIds = ref(new Set<string>())
const apiKeys = reactive<Record<string, string>>({})

watch(
  () => props.providers.map(provider => [provider.id, provider.keyTrimmed] as const),
  providers => {
    for (const [id, keyTrimmed] of providers) apiKeys[id] = keyTrimmed ?? ''
  },
  { immediate: true },
)

function isOpen(id: string) {
  return openIds.value.has(id)
}

function togglePanel(id: string) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

function hasStoredKey(provider: Provider) {
  return Boolean(provider.keyTrimmed)
}

function save(provider: Provider) {
  const apiKey = apiKeys[provider.id]?.trim() ?? ''
  if (!apiKey || props.savingId) return
  emit('save', provider, apiKey)
}
</script>

<template>
  <div class="provider-accordion">
    <article
      v-for="provider in providers"
      :key="provider.id"
      class="provider-accordion__item"
      :class="{ 'provider-accordion__item--open': isOpen(provider.id) }"
    >
      <header class="provider-accordion__header">
        <h3 class="provider-accordion__heading">
          <button
            :id="`${instanceId}-${provider.id}-trigger`"
            type="button"
            class="provider-accordion__title-trigger"
            :aria-expanded="isOpen(provider.id)"
            :aria-controls="`${instanceId}-${provider.id}-panel`"
            @click="togglePanel(provider.id)"
          >
            <span class="provider-accordion__brand">
              <img
                :src="`/images/providers/${provider.provider}-icon.webp`"
                alt=""
                class="provider-accordion__brand-icon"
                width="24"
                height="24"
              >
              <img
                :src="`/images/providers/${provider.provider}-text.webp`"
                :alt="provider.name"
                class="provider-accordion__brand-text"
                height="18"
              >
            </span>
          </button>
        </h3>

        <div class="provider-accordion__controls">
          <UiToggle
            :model-value="provider.enabled"
            :disabled="togglingId === provider.id"
            :aria-label="`${provider.enabled ? 'Disable' : 'Enable'} ${provider.name}`"
            @update:model-value="emit('toggle', provider, $event)"
          />
          <button
            type="button"
            class="provider-accordion__chevron"
            :aria-label="`${isOpen(provider.id) ? 'Collapse' : 'Expand'} ${provider.name}`"
            :aria-expanded="isOpen(provider.id)"
            :aria-controls="`${instanceId}-${provider.id}-panel`"
            @click="togglePanel(provider.id)"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4 10 8l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div
        :id="`${instanceId}-${provider.id}-panel`"
        class="provider-accordion__panel"
        :class="{ 'provider-accordion__panel--open': isOpen(provider.id) }"
        role="region"
        :aria-labelledby="`${instanceId}-${provider.id}-trigger`"
      >
        <div class="provider-accordion__panel-clip">
          <div class="provider-accordion__content">
            <p class="provider-accordion__description">{{ provider.description }}</p>

            <form
              v-if="provider.requiresApiKey"
              class="provider-accordion__credential"
              @submit.prevent="save(provider)"
            >
              <label :for="`${instanceId}-${provider.id}-key`">Enter API Key</label>
              <input
                :id="`${instanceId}-${provider.id}-key`"
                v-model="apiKeys[provider.id]"
                type="text"
                :readonly="hasStoredKey(provider)"
                :disabled="savingId === provider.id"
                :autocomplete="hasStoredKey(provider) ? 'off' : 'new-password'"
                :aria-label="`${provider.name} API key`"
              >
              <UiButton
                v-if="hasStoredKey(provider)"
                type="button"
                variant="metal"
                size="sm"
              >
                Delete
              </UiButton>
              <UiButton
                v-else
                type="submit"
                variant="primary"
                size="sm"
                :disabled="!apiKeys[provider.id]?.trim()"
                :loading="savingId === provider.id"
              >
                Save
              </UiButton>
            </form>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.provider-accordion {
  background: var(--ll-color-metal-025);
}

.provider-accordion__header {
  display: flex;
  align-items: center;
  gap: var(--ll-space-6);
  padding-inline: var(--ll-space-6);
  border-radius: calc(var(--ll-radius-structural) / 2);
  transition: background-color var(--ll-duration-normal) var(--ll-ease-out);
}

.provider-accordion__item:not(.provider-accordion__item--open) .provider-accordion__header:hover,
.provider-accordion__item:not(.provider-accordion__item--open) .provider-accordion__header:focus-within {
  background: var(--ll-color-card);
}

.provider-accordion__heading {
  min-width: 0;
  flex: 1;
  margin: 0;
}

.provider-accordion__title-trigger {
  display: flex;
  width: 100%;
  align-items: center;
  padding: var(--ll-space-5) 0;
  color: var(--ll-color-ink);
  background: transparent;
  border: 0;
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
  text-align: left;
  cursor: pointer;
}

.provider-accordion__brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-2);
}

.provider-accordion__brand-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex: none;
  object-fit: contain;
}

.provider-accordion__brand-text {
  width: auto;
  max-width: min(12rem, 100%);
  height: 1.125rem;
  object-fit: contain;
}

.provider-accordion__controls {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--ll-space-4);
}

.provider-accordion__chevron {
  display: grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  place-items: center;
  color: var(--ll-color-text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--ll-radius-md);
  cursor: pointer;
}

.provider-accordion__chevron svg {
  width: 1rem;
  height: 1rem;
  transition: transform var(--ll-duration-normal) var(--ll-ease-out);
}

.provider-accordion__chevron[aria-expanded="true"] svg {
  transform: rotate(90deg);
}

.provider-accordion__title-trigger:focus-visible,
.provider-accordion__chevron:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}

.provider-accordion__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--ll-duration-normal) var(--ll-ease-out);
}

.provider-accordion__panel--open {
  grid-template-rows: 1fr;
}

.provider-accordion__panel-clip {
  min-height: 0;
  overflow: hidden;
}

.provider-accordion__content {
  padding: 0 var(--ll-space-6) var(--ll-space-6);
}

.provider-accordion__description {
  max-width: 48rem;
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.5;
}

.provider-accordion__credential {
  display: grid;
  grid-template-columns: auto minmax(10rem, 1fr) auto;
  align-items: center;
  gap: var(--ll-space-3);
  max-width: 48rem;
  margin-top: var(--ll-space-5);
}

.provider-accordion__credential label {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
  white-space: nowrap;
}

.provider-accordion__credential input {
  min-width: 0;
  height: 1.75rem;
  box-sizing: border-box;
  padding: 0 var(--ll-space-3);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  font: 500 var(--ll-text-sm) / 1 var(--ll-font-mono);
}

.provider-accordion__credential input:focus-visible {
  border-color: var(--ll-color-primary);
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 1px;
}

.provider-accordion__credential input[readonly] {
  color: var(--ll-color-text-muted);
  cursor: default;
}

@media (max-width: 39.99rem) {
  .provider-accordion__header,
  .provider-accordion__content {
    padding-inline: var(--ll-space-4);
  }

  .provider-accordion__credential {
    grid-template-columns: 1fr auto;
  }

  .provider-accordion__credential label {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .provider-accordion__chevron svg,
  .provider-accordion__panel {
    transition: none;
  }
}
</style>
