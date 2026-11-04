export interface ApiListResponse<T> {
  items: T[]
  total: number
}

export interface ApiDeleteResponse {
  deleted: true
}

export interface ApiErrorDetail {
  code: string
  message: string
  details: Record<string, unknown> | null
}

export interface ApiErrorEnvelope {
  error: ApiErrorDetail
}

export interface ApiListQuery {
  offset?: number
}

export interface ApiSearchQuery {
  search?: string
}

export type ApiInstructionOrigin = 'builtin' | 'custom' | 'marketplace'

export interface ApiInstructionCapabilities {
  origin: ApiInstructionOrigin
  enabled: boolean
  editable: boolean
  duplicable: boolean
  deprecated: boolean
  catalog_version: number | null
  source_instruction_id: string | null
}

export interface ApiInstructionSummary extends ApiInstructionCapabilities {
  id: string
  name: string
  description: string
  version: number
  created_at: string
  updated_at: string
}
