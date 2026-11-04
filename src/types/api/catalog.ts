import type { InstructionCategory } from './instructions'

export type CatalogAgentRole = 'generator' | 'reviewer'
export type CatalogSkillPhase = 'code_review' | 'deliberation' | 'review'
export type CatalogSkillArtifact = 'changed_files' | 'contributions' | 'current_artifact' | 'git_diff' | 'prompt'
export type CatalogSkillOutput = 'json'

export interface CatalogInstructionMetadata {
  applies_when: string[]
  applies_to: CatalogAgentRole[]
}

export interface CatalogInstructionResponse {
  id: string
  name: string
  description: string
  instructions: string
  metadata: CatalogInstructionMetadata
  enabled_by_default: boolean
  catalog_version: number
  deprecated: boolean
  category: InstructionCategory | null
}

export interface CatalogPersonaResponse extends CatalogInstructionResponse {
  skill_ids: string[]
  default_for: CatalogAgentRole[]
}

export interface CatalogSkillStrictness {
  prototype: number
  mvp: number
  production: number
}

export interface CatalogSkillResponse extends CatalogInstructionResponse {
  reviewer_default_strictness: CatalogSkillStrictness | null
  phase: CatalogSkillPhase | null
  artifacts: CatalogSkillArtifact[]
  output: CatalogSkillOutput | null
}
