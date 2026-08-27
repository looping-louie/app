import type { ApiListResponse } from './common'
import type { ExecutionHarness, ExecutionOverrides } from './execution'

export type ActivityStatus = 'active' | 'disabled' | 'archived'
export type ActivityLoopFlow = 'direct' | 'refinement' | 'roundtable'
export type ActivityLoopRole = 'generator' | 'reviewer' | 'aggregator'
export type ActivityLoopOutputType = 'text' | 'json' | 'files'
export type ActivityLoopType = 'direct_loop' | 'refinement_loop' | 'roundtable_loop'
export type ActivityType = 'approval' | 'quiz' | ActivityLoopType

export interface ActivityLoopStopConditions {
  max_iterations: number | null
  max_tokens: number | null
  timeout_seconds: number | null
}

export interface ActivityLoopAgentInput {
  id?: string | null
  model_id?: string | null
  persona_id: string
  role: ActivityLoopRole
}

export interface ActivityLoopOutputContract {
  type: ActivityLoopOutputType
  description: string
  files: string[]
  schema: Record<string, unknown> | null
}

export interface ActivityLoopConfig {
  stop_conditions: ActivityLoopStopConditions
  agents: ActivityLoopAgentInput[]
  output_contract: ActivityLoopOutputContract
}

export type ApprovalActivityConfig = Record<string, never>

export interface QuizActivityConfig {
  quiz: Record<string, unknown>
}

export type ActivityConfig = ActivityLoopConfig | ApprovalActivityConfig | QuizActivityConfig

interface ActivityRequestBase extends ExecutionOverrides {
  name: string
  description: string
}

export type ActivityCreateRequest = ActivityRequestBase & (
  | { type: ActivityLoopType, config: ActivityLoopConfig }
  | { type: 'approval', config: ApprovalActivityConfig }
  | { type: 'quiz', config: QuizActivityConfig }
)

export interface ActivityPatchRequest {
  name?: string
  description?: string
  status?: ActivityStatus
  config?: ActivityConfig
  model_id?: string | null
  harness?: ExecutionHarness | null
}

interface ActivityResponseMetadata {
  id: string
  status: ActivityStatus
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
  model_id: string | null
  harness: ExecutionHarness | null
}

export type ActivityResponse = ActivityCreateRequest & ActivityResponseMetadata

export type ActivityListResponse = ApiListResponse<ActivityResponse>

export function isActivityLoop(activity: ActivityResponse): activity is ActivityResponse & { type: ActivityLoopType, config: ActivityLoopConfig } {
  return activity.type.endsWith('_loop')
}
