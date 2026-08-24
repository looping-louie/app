<script setup lang="ts">
import type { LinkedServiceFormValue } from '~/components/settings/LinkedServiceModal.vue'
import type { ProviderCatalogItem } from '~/composables/useProviders'
import type { LinkedServicePatchRequest, LinkedServiceResponse } from '~/types/api'
import LinkedServiceModal from '~/components/settings/LinkedServiceModal.vue'
import ProviderAccordion from '~/components/settings/ProviderAccordion.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
import { useProviders } from '~/composables/useProviders'
import { apiErrorMessage } from '~/utils/api/errors'

const {
  providers,
  pending,
  error,
  fetchProviders,
  createLinkedService,
  patchLinkedService,
  deleteLinkedService,
} = useProviders()

const mutatingId = ref<string | null>(null)
const feedback = ref('')
const connectionModalOpen = ref(false)
const selectedProvider = ref<ProviderCatalogItem | null>(null)
const selectedService = ref<LinkedServiceResponse | null>(null)
const savingConnection = ref(false)
const connectionError = ref('')
const deleteModalOpen = ref(false)
const deleteService = ref<LinkedServiceResponse | null>(null)
const deleting = ref(false)
const deleteError = ref('')
const providerStageStatus = computed<'pending' | 'error' | 'success'>(() => {
  if (pending.value) return 'pending'
  if (error.value) return 'error'
  return 'success'
})

await useAsyncData('settings-providers', () => fetchProviders())

function openConnectionModal(provider: ProviderCatalogItem, service: LinkedServiceResponse | null = null) {
  selectedProvider.value = provider
  selectedService.value = service
  connectionError.value = ''
  connectionModalOpen.value = true
}

function updateConnectionModal(open: boolean) {
  if (savingConnection.value) return
  connectionModalOpen.value = open
  if (!open) connectionError.value = ''
}

async function saveConnection(value: LinkedServiceFormValue) {
  const provider = selectedProvider.value
  if (!provider || savingConnection.value) return

  savingConnection.value = true
  connectionError.value = ''
  feedback.value = ''

  try {
    if (selectedService.value) {
      const body: LinkedServicePatchRequest = { name: value.name }
      const config: NonNullable<LinkedServicePatchRequest['config']> = {}

      if (value.apiKey) config.api_key = value.apiKey
      if (value.baseUrl !== (selectedService.value.config.base_url ?? '')) {
        config.base_url = value.baseUrl || null
      }
      if (Object.keys(config).length) body.config = config

      const service = await patchLinkedService(selectedService.value.id, body)
      feedback.value = `${service.name} updated.`
    } else {
      const service = await createLinkedService({
        name: value.name,
        provider_type: provider.id,
        config: {
          ...(value.apiKey ? { api_key: value.apiKey } : {}),
          ...(value.baseUrl ? { base_url: value.baseUrl } : {}),
        },
      })
      feedback.value = `${service.name} connected to ${provider.name}.`
    }

    connectionModalOpen.value = false
  } catch (cause) {
    connectionError.value = apiErrorMessage(cause, `Unable to connect ${provider.name}.`)
  } finally {
    savingConnection.value = false
  }
}

async function updateConnection(service: LinkedServiceResponse, enabled: boolean) {
  if (mutatingId.value) return

  const previousValue = service.enabled
  service.enabled = enabled
  mutatingId.value = service.id
  feedback.value = ''

  try {
    const result = await patchLinkedService(service.id, { enabled })
    feedback.value = `${result.name} ${result.enabled ? 'enabled' : 'disabled'}.`
  } catch (cause) {
    service.enabled = previousValue
    feedback.value = apiErrorMessage(cause, `Unable to update ${service.name}.`)
  } finally {
    mutatingId.value = null
  }
}

function openDeleteModal(_provider: ProviderCatalogItem, service: LinkedServiceResponse) {
  deleteService.value = service
  deleteError.value = ''
  deleteModalOpen.value = true
}

function updateDeleteModal(open: boolean) {
  if (deleting.value) return
  deleteModalOpen.value = open
  if (!open) deleteError.value = ''
}

async function confirmDelete() {
  const service = deleteService.value
  if (!service || deleting.value) return

  deleting.value = true
  deleteError.value = ''
  feedback.value = ''

  try {
    await deleteLinkedService(service.id)
    feedback.value = `${service.name} deleted.`
    deleteModalOpen.value = false
  } catch (cause) {
    deleteError.value = apiErrorMessage(cause, `Unable to delete ${service.name}.`)
  } finally {
    deleting.value = false
  }
}

definePageMeta({
  pageTransition: false,
})

useHead({
  title: 'Providers · Settings · Looping Louie',
})
</script>

<template>
  <section aria-labelledby="providers-heading">
    <h2 id="providers-heading" class="visually-hidden">Providers</h2>

    <UiAsyncStage
      :status="providerStageStatus"
      :empty="providers.length === 0"
      loading-label="Loading provider catalog and connections…"
      :error-label="error || 'Providers could not be loaded.'"
      empty-label="No providers found."
      @retry="fetchProviders"
    >
      <ProviderAccordion
        :providers="providers"
        :mutating-id="mutatingId"
        aria-label="Provider catalog and workspace connections"
        @connect="openConnectionModal"
        @manage="openConnectionModal"
        @toggle="updateConnection"
        @delete="openDeleteModal"
      />
    </UiAsyncStage>

    <p class="settings-feedback" aria-live="polite">{{ feedback }}</p>

    <LinkedServiceModal
      :open="connectionModalOpen"
      :provider="selectedProvider"
      :service="selectedService"
      :saving="savingConnection"
      :error="connectionError"
      @update:open="updateConnectionModal"
      @submit="saveConnection"
    />

    <UiModal
      :open="deleteModalOpen"
      title="Delete this connection?"
      :description="deleteService
        ? `This permanently deletes ${deleteService.name}. Anything using this connection must be changed first.`
        : undefined"
      :close-on-backdrop="!deleting"
      :show-close="!deleting"
      @update:open="updateDeleteModal"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
      <p v-if="deleteError" class="settings-delete-error" role="alert">{{ deleteError }}</p>
      <template #actions>
        <UiButton data-autofocus variant="secondary" :disabled="deleting" @click="updateDeleteModal(false)">Cancel</UiButton>
        <UiButton variant="coral" :loading="deleting" @click="confirmDelete">Delete connection</UiButton>
      </template>
    </UiModal>
  </section>
</template>

<style scoped>
.settings-feedback {
  min-height: 1.5rem;
  margin: var(--ll-space-4) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}

.settings-delete-error {
  margin: 0;
  color: var(--ll-color-brand);
  font-size: var(--ll-text-sm);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
