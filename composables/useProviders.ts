import type { Ref } from 'vue'

export interface Provider {
  id: string
  name: string
  description: string
  logo: string
  enabled: boolean
  keyTrimmed: string | null
  baseUrl: string | null
  requiresApiKey: boolean
  modelCount: number
}

interface ApiProvider {
  id: string
  name: string
  description: string
  logo: string
  enabled: boolean
  key_trimmed: string | null
  base_url: string | null
  requires_api_key: boolean
  model_count: number
}

const PROVIDER_ORDER = ['anthropic', 'nvidia', 'ollama', 'openai', 'together']

function mapProvider(raw: ApiProvider): Provider {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    logo: raw.logo,
    enabled: raw.enabled,
    keyTrimmed: raw.key_trimmed,
    baseUrl: raw.base_url,
    requiresApiKey: raw.requires_api_key,
    modelCount: raw.model_count
  }
}

function sortByDeclaredOrder(providers: Provider[]): Provider[] {
  return [...providers].sort((a, b) => {
    const ai = PROVIDER_ORDER.indexOf(a.id)
    const bi = PROVIDER_ORDER.indexOf(b.id)
    return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi)
  })
}

export function useProviders() {
  const providers: Ref<Provider[]> = ref([])
  const pending = ref(true)
  const error = ref<string | null>(null)

  async function fetchProviders() {
    pending.value = true
    error.value = null
    try {
      const data = await $fetch<ApiProvider[]>('/providers')
      providers.value = sortByDeclaredOrder(data.map(mapProvider))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load providers.'
      providers.value = []
    } finally {
      pending.value = false
    }
  }

  return {
    providers,
    pending,
    error,
    fetchProviders
  }
}
