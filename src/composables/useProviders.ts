import type {
  LinkedServiceCreateRequest,
  LinkedServicePatchRequest,
  LinkedServiceResponse,
  ProviderId,
} from '~/types/api'

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

  async function fetchProviders(signal?: AbortSignal): Promise<ProviderCatalogItem[]> {
    const [catalog, linkedServices] = await Promise.all([
      api.catalog.listProviders(signal),
      api.linkedServices.list(signal),
    ])

    return catalog.map(provider => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      logoUrl: provider.logo_url,
      requiresApiKey: provider.requires_api_key,
      defaultBaseUrl: provider.default_base_url,
      modelCatalogNote: provider.model_catalog_note,
      linkedServices: linkedServices.filter(service => service.provider_type === provider.id),
    }))
  }

  async function createLinkedService(body: LinkedServiceCreateRequest) {
    return api.linkedServices.create(body)
  }

  async function patchLinkedService(id: string, body: LinkedServicePatchRequest) {
    return api.linkedServices.patch(id, body)
  }

  async function deleteLinkedService(id: string) {
    await api.linkedServices.remove(id)
  }

  return {
    fetchProviders,
    createLinkedService,
    patchLinkedService,
    deleteLinkedService,
  }
}
