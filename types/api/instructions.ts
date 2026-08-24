import type { ApiInstructionCapabilities, ApiInstructionSummary, ApiListResponse } from './common'

export type InstructionCategory =
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

export type InstructionStatus = 'enabled' | 'disabled'
export type InstructionSort = 'alphabetical-asc' | 'alphabetical-desc' | 'newest' | 'oldest'

export type PersonaCategory = InstructionCategory
export type PersonaStatus = InstructionStatus
export type PersonaSort = InstructionSort

export interface LinkedServiceReference {
  type: 'LinkedServiceReference'
  reference_id: string
}

export interface PersonaLinkedServiceConfig {
  model: string
}

export interface PersonaListQuery {
  status?: PersonaStatus
  category?: PersonaCategory[]
  sort?: PersonaSort
  offset?: number
  search?: string
}

export interface PersonaSummary extends ApiInstructionSummary {
  linked_service: LinkedServiceReference | null
  config: PersonaLinkedServiceConfig | null
  category: PersonaCategory | null
}

export interface PersonaResponse extends ApiInstructionCapabilities {
  id: string
  name: string
  description: string
  instructions: string
  linked_service: LinkedServiceReference | null
  config: PersonaLinkedServiceConfig | null
  skill_ids: string[]
  metadata: Record<string, unknown>
  version: number
  created_at: string
  updated_at: string
}

export interface PersonaCreateRequest {
  name: string
  description: string
  instructions: string
  linked_service: LinkedServiceReference
  config: PersonaLinkedServiceConfig
  skill_ids: string[]
  metadata: {
    category: PersonaCategory
  }
}

export interface PersonaPatchRequest {
  expected_version: number
  name?: string
  description?: string
  instructions?: string
  linked_service?: LinkedServiceReference
  config?: PersonaLinkedServiceConfig
  skill_ids?: string[]
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

export type SkillCategory = InstructionCategory
export type SkillStatus = InstructionStatus
export type SkillSort = InstructionSort

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

export interface SkillCreateRequest {
  name: string
  description: string
  instructions: string
  metadata: {
    category: SkillCategory
  }
}

export type SkillListResponse = ApiListResponse<SkillSummary>
