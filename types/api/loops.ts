import type { ApiListResponse } from './common'

export type LoopFlow = 'direct' | 'refinement' | 'roundtable'
export type LoopStatus = 'active' | 'disabled' | 'archived'
export type LoopRole = 'generator' | 'reviewer' | 'aggregator'
export type LoopOutputType = 'text' | 'json' | 'files'

export interface LoopStopConditions {
  max_iterations: number | null
  max_tokens: number | null
  timeout_seconds: number | null
}

export interface LoopAgentInput {
  id?: string | null
  model_id: string
  persona_id: string
  role: LoopRole
}

export interface LoopAgent extends LoopAgentInput {
  id: string
}

export interface LoopOutputContract {
  type: LoopOutputType
  description: string
  files: string[]
  schema: Record<string, unknown> | null
}

export interface LoopCreateRequest {
  title: string
  description: string
  flow: LoopFlow
  stop_conditions: LoopStopConditions
  agents: LoopAgentInput[]
  output_contract: LoopOutputContract
}

export type LoopPatchRequest = Partial<LoopCreateRequest & { status: LoopStatus }>

export interface LoopResponse extends Omit<LoopCreateRequest, 'agents'> {
  id: string
  status: LoopStatus
  agents: LoopAgent[]
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export type LoopListResponse = ApiListResponse<LoopResponse>
