import type { Ref } from 'vue'

export interface Provider {
  id: string
  name: string
  description: string
  logo: string
  enabled: boolean
  requiresApiKey: boolean
  keyTrimmed?: string
  baseUrl?: string
  modelCount: number
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
      const data = await $fetch<Provider[]>('/api/v1/providers')
      providers.value = data
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
