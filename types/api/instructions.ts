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
}

export type SkillSummary = ApiInstructionSummary

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
