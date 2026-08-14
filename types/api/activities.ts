import type { ApiListResponse } from './common'
import type { LoopAgentInput, LoopOutputContract, LoopStopConditions } from './loops'

export type ActivityStatus = 'active' | 'disabled' | 'archived'
export type LoopActivityType = 'direct_loop' | 'refinement_loop' | 'roundtable_loop'
export type ActivityType = 'approval' | 'quiz' | LoopActivityType

export interface LoopActivityConfig {
  stop_conditions: LoopStopConditions
  agents: LoopAgentInput[]
  output_contract: LoopOutputContract
}

export type ApprovalActivityConfig = Record<string, never>

export interface QuizActivityConfig {
  quiz: Record<string, unknown>
}

export type ActivityConfig = LoopActivityConfig | ApprovalActivityConfig | QuizActivityConfig

interface ActivityRequestBase {
  name: string
  description: string
}

export type ActivityCreateRequest = ActivityRequestBase & (
  | { type: LoopActivityType, config: LoopActivityConfig }
  | { type: 'approval', config: ApprovalActivityConfig }
  | { type: 'quiz', config: QuizActivityConfig }
)

export interface ActivityPatchRequest {
  name?: string
  description?: string
  status?: ActivityStatus
  config?: ActivityConfig
}

interface ActivityResponseMetadata {
  id: string
  workspace_id: string
  status: ActivityStatus
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export type ActivityResponse = ActivityCreateRequest & ActivityResponseMetadata

export type ActivityListResponse = ApiListResponse<ActivityResponse>

export function isLoopActivity(activity: ActivityResponse): activity is ActivityResponse & { type: LoopActivityType, config: LoopActivityConfig } {
  return activity.type.endsWith('_loop')
}
