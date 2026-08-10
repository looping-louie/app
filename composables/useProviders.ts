import type { Ref } from 'vue'

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

interface ProviderResponse {
  id?: string
  provider?: string
  name: string
  description: string
  logo?: string
  logo_url?: string
  enabled: boolean
  requiresApiKey?: boolean
  requires_api_key?: boolean
  keyTrimmed?: string | null
  key_trimmed?: string | null
  baseUrl?: string
  base_url?: string
  modelCount?: number
  model_count?: number
}

interface SaveCredentialResponse {
  key_trimmed: string
  model_count: number
}

interface SetEnabledResponse {
  enabled: boolean
  has_credential: boolean
  key_trimmed?: string
  model_count?: number
}

export function useProviders() {
  const providers: Ref<Provider[]> = ref([])
  const pending = ref(true)
  const error = ref<string | null>(null)

  async function fetchProviders() {
    pending.value = true
    error.value = null
    try {
      const data = await $fetch<ProviderResponse[]>('/api/v1/providers')
      providers.value = data.map(provider => ({
        id: provider.id ?? provider.provider ?? '',
        provider: provider.provider ?? provider.id ?? '',
        name: provider.name,
        description: provider.description,
        logo: provider.logo ?? provider.logo_url ?? '',
        enabled: provider.enabled,
        requiresApiKey: provider.requiresApiKey ?? provider.requires_api_key ?? false,
        keyTrimmed: provider.keyTrimmed ?? provider.key_trimmed ?? undefined,
        baseUrl: provider.baseUrl ?? provider.base_url,
        modelCount: provider.modelCount ?? provider.model_count ?? 0,
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load providers.'
    } finally {
      pending.value = false
    }
  }

  async function saveCredential(id: string, body: Record<string, string>): Promise<SaveCredentialResponse> {
    return await $fetch<SaveCredentialResponse>(`/api/v1/providers/describe/${id}`, {
      method: 'POST',
      body
    })
  }

  async function setEnabled(id: string, enabled: boolean): Promise<SetEnabledResponse> {
    return await $fetch<SetEnabledResponse>(`/api/v1/providers/enable/${id}`, {
      method: 'PATCH',
      body: { enabled }
    })
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
