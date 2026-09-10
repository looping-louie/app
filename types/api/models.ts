import type { ApiListResponse } from './common'

export type ProviderId = 'anthropic' | 'nvidia' | 'ollama' | 'openai' | 'together'
export type ModelStatus = 'active' | 'deprecated' | 'preview'
export type ModelSort = 'alphabetical-asc' | 'alphabetical-desc' | 'newest' | 'oldest'
export type ModelEndpoint = 'chat_completions' | 'messages' | 'responses'
export type ModelCapability = 'coding' | 'function_calling' | 'reasoning' | 'structured_output' | 'text' | 'vision'

export interface ModelPricing {
  input_per_million_usd: string
  output_per_million_usd: string
  cached_input_per_million_usd: string | null
  valid_until: string | null
  note: string | null
}

export interface ModelSummary {
  id: string
  name: string
  vendor: string
  family: string
  description: string
  released_at: string
  capabilities: ModelCapability[]
  status: ModelStatus
  enabled: boolean
  available: boolean
  offerings: ModelOffering[]
  tags: string[]
}

export interface ModelOffering {
  provider_id: ProviderId
  provider_model_id: string
  endpoint: ModelEndpoint
  context_window: number | null
  max_output_tokens: number | null
  pricing: ModelPricing | null
  status: ModelStatus
  deprecated_at: string | null
  configured: boolean
  enabled: boolean
  available: boolean
  reason: string | null
}

export interface ModelResponse extends ModelSummary {
  replacement_model_id: string | null
}

export interface ModelListQuery {
  provider_id?: ProviderId
  capability?: ModelCapability
  status?: ModelStatus
  lab?: string[]
  sort?: ModelSort
  offset?: number
  available?: boolean
  search?: string
  include_deprecated?: boolean
}

export type ModelListResponse = ApiListResponse<ModelSummary>
