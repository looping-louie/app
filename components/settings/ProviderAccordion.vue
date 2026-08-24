<script setup lang="ts">
import type { LinkedServiceResponse } from '~/types/api'
import type { ProviderCatalogItem } from '~/composables/useProviders'
import UiButton from '~/components/ui/Button.vue'
import UiToggle from '~/components/ui/Toggle.vue'

const props = withDefaults(defineProps<{
  providers: ProviderCatalogItem[]
  mutatingId?: string | null
}>(), {
  mutatingId: null,
})

const emit = defineEmits<{
  connect: [provider: ProviderCatalogItem]
  manage: [provider: ProviderCatalogItem, service: LinkedServiceResponse]
  toggle: [service: LinkedServiceResponse, enabled: boolean]
  delete: [provider: ProviderCatalogItem, service: LinkedServiceResponse]
}>()

const instanceId = useId().replaceAll(':', '')
const openIds = ref(new Set<string>())

function isOpen(id: string) {
  return openIds.value.has(id)
}

function togglePanel(id: string) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

function providerLogo(provider: ProviderCatalogItem) {
  return provider.logoUrl.replace(/\.(?:jpe?g|png)$/i, '.webp')
}

function connectionLabel(count: number) {
  return `${count} ${count === 1 ? 'connection' : 'connections'}`
}

function modelLabel(count: number) {
  return `${count} ${count === 1 ? 'model' : 'models'}`
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
            <img
              :src="providerLogo(provider)"
              alt=""
              class="provider-accordion__brand-icon"
              width="32"
              height="32"
            >
            <span class="provider-accordion__title-copy">
              <span class="provider-accordion__provider-name">{{ provider.name }}</span>
              <span class="provider-accordion__connection-count">{{ connectionLabel(provider.linkedServices.length) }}</span>
            </span>
          </button>
        </h3>

        <div class="provider-accordion__controls">
          <UiButton size="sm" variant="stroke" @click="emit('connect', provider)">Connect</UiButton>
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
            <div class="provider-accordion__catalog-copy">
              <p class="provider-accordion__description">{{ provider.description }}</p>
              <p v-if="provider.modelCatalogNote" class="provider-accordion__catalog-note">{{ provider.modelCatalogNote }}</p>
            </div>

            <div v-if="provider.linkedServices.length" class="provider-accordion__connections">
              <article
                v-for="service in provider.linkedServices"
                :key="service.id"
                class="provider-accordion__connection"
              >
                <div class="provider-accordion__connection-main">
                  <div class="provider-accordion__connection-heading">
                    <h4>{{ service.name }}</h4>
                    <span
                      class="provider-accordion__status"
                      :class="{ 'provider-accordion__status--ready': service.config.configured }"
                    >
                      {{ service.config.configured ? 'Configured' : 'Needs setup' }}
                    </span>
                  </div>

                  <dl class="provider-accordion__facts">
                    <div>
                      <dt>Credential</dt>
                      <dd>{{ service.config.key_trimmed ?? (provider.requiresApiKey ? 'Not set' : 'Not required') }}</dd>
                    </div>
                    <div>
                      <dt>Base URL</dt>
                      <dd>{{ service.config.base_url ?? provider.defaultBaseUrl ?? 'Provider default' }}</dd>
                    </div>
                    <div>
                      <dt>Availability</dt>
                      <dd>{{ modelLabel(service.config.available_models.length) }}</dd>
                    </div>
                  </dl>
                </div>

                <div class="provider-accordion__connection-actions">
                  <UiToggle
                    :model-value="service.enabled"
                    :disabled="mutatingId === service.id"
                    :aria-label="`${service.enabled ? 'Disable' : 'Enable'} ${service.name}`"
                    @update:model-value="emit('toggle', service, $event)"
                  />
                  <UiButton size="sm" variant="metal" :disabled="mutatingId === service.id" @click="emit('manage', provider, service)">
                    Manage
                  </UiButton>
                  <UiButton
                    size="sm"
                    variant="coral"
                    :disabled="mutatingId === service.id"
                    icon-only
                    :aria-label="`Delete ${service.name}`"
                    @click="emit('delete', provider, service)"
                  >
                    <template #leading>
                      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                        <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
                      </svg>
                    </template>
                  </UiButton>
                </div>
              </article>
            </div>

            <div v-else class="provider-accordion__empty">
              <p>No workspace connections yet.</p>
              <UiButton size="sm" @click="emit('connect', provider)">Connect {{ provider.name }}</UiButton>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.provider-accordion { background: var(--ll-color-metal-025); }

.provider-accordion__item + .provider-accordion__item { border-top: 1px solid var(--ll-color-divider); }

.provider-accordion__header {
  display: flex;
  align-items: center;
  gap: var(--ll-space-6);
  padding-inline: var(--ll-space-6);
  border-radius: calc(var(--ll-radius-structural) / 2);
  transition: background-color var(--ll-duration-normal) var(--ll-ease-out);
}

.provider-accordion__item:not(.provider-accordion__item--open) .provider-accordion__header:hover,
.provider-accordion__item:not(.provider-accordion__item--open) .provider-accordion__header:focus-within { background: var(--ll-color-card); }

.provider-accordion__heading { min-width: 0; flex: 1; margin: 0; }

.provider-accordion__title-trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-5) 0;
  color: var(--ll-color-ink);
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.provider-accordion__brand-icon { width: 2rem; height: 2rem; flex: none; object-fit: contain; border-radius: var(--ll-radius-md); }
.provider-accordion__title-copy { display: grid; min-width: 0; gap: 0.1rem; }
.provider-accordion__provider-name { font-size: 1.125rem; font-weight: 650; line-height: 1.2; letter-spacing: -0.02em; }
.provider-accordion__connection-count { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); font-weight: 500; }
.provider-accordion__controls { display: flex; flex: none; align-items: center; gap: var(--ll-space-3); }

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

.provider-accordion__chevron svg { width: 1rem; height: 1rem; transition: transform var(--ll-duration-normal) var(--ll-ease-out); }
.provider-accordion__chevron[aria-expanded="true"] svg { transform: rotate(90deg); }
.provider-accordion__title-trigger:focus-visible,
.provider-accordion__chevron:focus-visible { outline: 2px solid var(--ll-color-primary); outline-offset: 3px; }
.provider-accordion__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--ll-duration-normal) var(--ll-ease-out); }
.provider-accordion__panel--open { grid-template-rows: 1fr; }
.provider-accordion__panel-clip { min-height: 0; overflow: hidden; }
.provider-accordion__content { padding: 0 var(--ll-space-6) var(--ll-space-6); }
.provider-accordion__catalog-copy { display: grid; max-width: 52rem; gap: var(--ll-space-2); }
.provider-accordion__description,
.provider-accordion__catalog-note { margin: 0; color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); line-height: 1.5; }
.provider-accordion__catalog-note { font-style: italic; }
.provider-accordion__connections { display: grid; gap: var(--ll-space-3); margin-top: var(--ll-space-5); }

.provider-accordion__connection {
  display: flex;
  align-items: center;
  gap: var(--ll-space-5);
  padding: var(--ll-space-4);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
}

.provider-accordion__connection-main { min-width: 0; flex: 1; }
.provider-accordion__connection-heading { display: flex; align-items: center; gap: var(--ll-space-2); }
.provider-accordion__connection-heading h4 { margin: 0; font-size: 0.95rem; font-weight: 650; }
.provider-accordion__status { padding: 0.15rem 0.5rem; color: var(--ll-color-text-muted); background: var(--ll-color-metal-100); border-radius: var(--ll-radius-pill); font-size: var(--ll-text-xs); font-weight: 600; }
.provider-accordion__status--ready { color: var(--ll-color-primary); background: var(--ll-color-primary-highlight); }
.provider-accordion__facts { display: flex; flex-wrap: wrap; gap: var(--ll-space-3) var(--ll-space-6); margin: var(--ll-space-3) 0 0; }
.provider-accordion__facts div { display: grid; min-width: 8rem; gap: 0.1rem; }
.provider-accordion__facts div:nth-child(2) { min-width: min(20rem, 100%); }
.provider-accordion__facts dt { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
.provider-accordion__facts dd { overflow: hidden; margin: 0; font: 500 var(--ll-text-xs) / 1.4 var(--ll-font-mono); text-overflow: ellipsis; white-space: nowrap; }
.provider-accordion__connection-actions { display: flex; flex: none; align-items: center; gap: var(--ll-space-2); }

.provider-accordion__empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
  margin-top: var(--ll-space-5);
  padding: var(--ll-space-4);
  background: var(--ll-color-canvas);
  border: 1px dashed var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
}

.provider-accordion__empty p { margin: 0; color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }

@media (max-width: 49.99rem) {
  .provider-accordion__connection { align-items: stretch; flex-direction: column; }
  .provider-accordion__connection-actions { justify-content: flex-end; }
}

@media (max-width: 39.99rem) {
  .provider-accordion__header,
  .provider-accordion__content { padding-inline: var(--ll-space-4); }
  .provider-accordion__controls > :first-child { display: none; }
  .provider-accordion__empty { align-items: stretch; flex-direction: column; }
  .provider-accordion__connection-actions { flex-wrap: wrap; }
}

@media (prefers-reduced-motion: reduce) {
  .provider-accordion__chevron svg,
  .provider-accordion__panel { transition: none; }
}
</style>
