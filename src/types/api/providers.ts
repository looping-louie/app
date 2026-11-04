import type { ProviderId } from './models'

export interface CatalogProviderResponse {
  id: ProviderId
  name: string
  description: string
  logo_url: string
  requires_api_key: boolean
  default_base_url: string | null
  model_catalog_note: string | null
}

export interface LinkedServiceConfigRequest {
  api_key?: string | null
  base_url?: string | null
}

export interface LinkedServiceCreateRequest {
  name: string
  provider_type: ProviderId
  enabled?: boolean
  config?: LinkedServiceConfigRequest
}

export interface LinkedServicePatchRequest {
  name?: string
  enabled?: boolean
  config?: LinkedServiceConfigRequest
}

export interface LinkedServiceConfigResponse {
  base_url: string | null
  key_trimmed: string | null
  configured: boolean
  available_models: string[]
}

export interface LinkedServiceResponse {
  id: string
  name: string
  provider_type: ProviderId
  enabled: boolean
  config: LinkedServiceConfigResponse
  version: number
  created_at: string
  updated_at: string
}
