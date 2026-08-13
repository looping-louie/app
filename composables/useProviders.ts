import type { Ref } from 'vue'
import type { ProviderPatchRequest, ProviderResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

export interface Provider {
  id: string
  provider: string
  name: string
  description: string
  logo: string
  enabled: boolean
  requiresApiKey: boolean
  keyTrimmed?: string
  baseUrl?: string
  modelCount: number
}

export function useProviders() {
  const api = useApiClient()
  const providers: Ref<Provider[]> = ref([])
  const pending = ref(true)
  const error = ref<string | null>(null)

  async function fetchProviders() {
    pending.value = true
    error.value = null
    try {
      const data = await api.providers.list()
      providers.value = data.map(provider => ({
        id: provider.provider,
        provider: provider.provider,
        name: provider.name,
        description: provider.description,
        logo: provider.logo_url,
        enabled: provider.enabled,
        requiresApiKey: provider.requires_api_key,
        keyTrimmed: provider.key_trimmed ?? undefined,
        baseUrl: provider.base_url ?? undefined,
        modelCount: provider.model_count,
      }))
    } catch (err) {
      error.value = apiErrorMessage(err, 'Unable to load providers.')
    } finally {
      pending.value = false
    }
  }

  async function saveCredential(id: string, body: ProviderPatchRequest): Promise<ProviderResponse> {
    return await api.providers.patch(id, body)
  }

  async function setEnabled(id: string, enabled: boolean): Promise<ProviderResponse> {
    return await api.providers.patch(id, { enabled })
  }

  return {
    providers,
    pending,
    error,
    fetchProviders,
    saveCredential,
    setEnabled
  }
}
