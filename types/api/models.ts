import type { ApiListResponse } from './common'

export type ProviderId = 'anthropic' | 'nvidia' | 'ollama' | 'openai' | 'together'
export type ModelStatus = 'active' | 'deprecated' | 'preview'
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
  capabilities: ModelCapability[]
  status: ModelStatus
  providers: ProviderId[]
  available: boolean
  starting_price: ModelPricing | null
  tags: string[]
}

export interface ModelDeployment {
  provider_id: ProviderId
  provider_model_id: string
  endpoint: ModelEndpoint
  context_window: number | null
  max_output_tokens: number | null
  pricing: ModelPricing | null
  status: ModelStatus
  deprecated_at: string | null
}

export interface ModelProviderAvailability {
  provider_id: ProviderId
  configured: boolean
  enabled: boolean
  available: boolean
  reason: string | null
}

export interface ModelResponse extends Omit<ModelSummary, 'providers' | 'starting_price'> {
  replacement_model_id: string | null
  deployments: ModelDeployment[]
  availability: ModelProviderAvailability[]
}

export interface ModelListQuery {
  provider_id?: ProviderId
  capability?: ModelCapability
  status?: ModelStatus
  available?: boolean
  search?: string
  include_deprecated?: boolean
}

export type ModelListResponse = ApiListResponse<ModelSummary>
