export interface ProviderResponse {
  provider: string
  name: string
  description: string
  logo_url: string
  requires_api_key: boolean
  configured: boolean
  enabled: boolean
  key_trimmed: string | null
  base_url: string | null
  model_count: number
  model_catalog_note: string | null
}

export interface ProviderPatchRequest {
  api_key?: string | null
  base_url?: string | null
  enabled?: boolean
}
