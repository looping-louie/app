import type { ApiInstructionCapabilities, ApiInstructionSummary, ApiListResponse } from './common'

export type PersonaSummary = ApiInstructionSummary

export interface PersonaResponse extends ApiInstructionCapabilities {
  id: string
  name: string
  description: string
  instructions: string
  skill_ids: string[]
  metadata: Record<string, unknown>
  version: number
  created_at: string
  updated_at: string
}

export type PersonaListResponse = ApiListResponse<PersonaSummary>

export interface SkillDefaultStrictness {
  prototype: number | null
  mvp: number | null
  production: number | null
}

export interface SkillMetadata extends Record<string, unknown> {
  applies_when?: string[] | null
  default_strictness?: SkillDefaultStrictness | null
  category?: SkillCategory | null
}

export type SkillCategory =
  | 'software_engineering'
  | 'quality_reliability'
  | 'security_privacy'
  | 'data_ai'
  | 'product_discovery_strategy'
  | 'product_design_ux'
  | 'delivery_planning'
  | 'content_brand'
  | 'growth_acquisition'
  | 'research_analytics'
  | 'sales'
  | 'customer_success_support'

export type SkillStatus = 'enabled' | 'disabled'
export type SkillSort = 'alphabetical-asc' | 'alphabetical-desc' | 'newest' | 'oldest'

export interface SkillListQuery {
  status?: SkillStatus
  category?: SkillCategory[]
  sort?: SkillSort
  offset?: number
  search?: string
}

export interface SkillSummary extends ApiInstructionSummary {
  category: SkillCategory | null
}

export interface SkillResponse extends ApiInstructionCapabilities {
  id: string
  name: string
  description: string
  instructions: string
  metadata: SkillMetadata
  version: number
  created_at: string
  updated_at: string
}

export type SkillListResponse = ApiListResponse<SkillSummary>
