import type { Ref } from 'vue'
import type {
  LinkedServiceCreateRequest,
  LinkedServicePatchRequest,
  LinkedServiceResponse,
  ProviderId,
} from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

export interface ProviderCatalogItem {
  id: ProviderId
  name: string
  description: string
  logoUrl: string
  requiresApiKey: boolean
  defaultBaseUrl: string | null
  modelCatalogNote: string | null
  linkedServices: LinkedServiceResponse[]
}

export function useProviders() {
  const api = useApiClient()
  const providers: Ref<ProviderCatalogItem[]> = ref([])
  const pending = ref(true)
  const error = ref<string | null>(null)

  async function fetchProviders() {
    pending.value = true
    error.value = null

    try {
      const [catalog, linkedServices] = await Promise.all([
        api.catalog.listProviders(),
        api.linkedServices.list(),
      ])

      providers.value = catalog.map(provider => ({
        id: provider.id,
        name: provider.name,
        description: provider.description,
        logoUrl: provider.logo_url,
        requiresApiKey: provider.requires_api_key,
        defaultBaseUrl: provider.default_base_url,
        modelCatalogNote: provider.model_catalog_note,
        linkedServices: linkedServices.filter(service => service.provider_type === provider.id),
      }))
    } catch (cause) {
      error.value = apiErrorMessage(cause, 'Unable to load providers.')
    } finally {
      pending.value = false
    }
  }

  function upsertLinkedService(service: LinkedServiceResponse) {
    const provider = providers.value.find(item => item.id === service.provider_type)
    if (!provider) return

    const index = provider.linkedServices.findIndex(item => item.id === service.id)
    if (index === -1) provider.linkedServices.push(service)
    else provider.linkedServices[index] = service
  }

  async function createLinkedService(body: LinkedServiceCreateRequest) {
    const service = await api.linkedServices.create(body)
    upsertLinkedService(service)
    return service
  }

  async function patchLinkedService(id: string, body: LinkedServicePatchRequest) {
    const service = await api.linkedServices.patch(id, body)
    upsertLinkedService(service)
    return service
  }

  async function deleteLinkedService(id: string) {
    await api.linkedServices.remove(id)

    for (const provider of providers.value) {
      const index = provider.linkedServices.findIndex(service => service.id === id)
      if (index !== -1) {
        provider.linkedServices.splice(index, 1)
        return
      }
    }
  }

  return {
    providers,
    pending,
    error,
    fetchProviders,
    createLinkedService,
    patchLinkedService,
    deleteLinkedService,
  }
}
