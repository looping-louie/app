import type { ApiListQuery, ApiListResponse } from './common'

export type LoopRunStatus = 'in_progress' | 'failed' | 'completed' | 'stopped'
export type LoopRunState = 'awaiting_snapshot' | 'awaiting_generation' | 'awaiting_apply' | 'awaiting_review_input' | 'awaiting_commit' | 'awaiting_human_decision' | 'completed' | 'failed'
export type LoopRunAction = 'collect_snapshot' | 'apply_operations' | 'submit_review_input' | 'commit_if_allowed' | 'submit_human_decision' | 'none'

export interface ActivityRunResponse {
  id: string
  activity_id: string
  input: string
  status: LoopRunStatus
  state: LoopRunState
  next_action: LoopRunAction
  iteration: number
  token_revision: number
  continuation_token: string | null
  created_at: string
  created_by: string
  updated_at: string
  payload: Record<string, unknown>
}

export type ActivityRunListResponse = ApiListResponse<ActivityRunResponse>
export type LoopRunResponse = ActivityRunResponse
export type LoopRunListResponse = ActivityRunListResponse

export type ActivityRunHumanDecision = 'approved' | 'rejected' | 'cancelled'

export interface ActivityRunHumanDecisionResult {
  action: 'submit_human_decision'
  decision: ActivityRunHumanDecision
  comment?: string | null
}

export interface ActivityRunContinueRequest {
  pipeline_run_id?: string | null
  lease_token?: string | null
  continuation_token: string
  idempotency_key: string
  result: ActivityRunHumanDecisionResult
}

export type PipelineRunStatus = 'prepared' | 'queued' | 'claimed' | 'in_progress' | 'waiting' | 'failed' | 'completed'
export type PipelineRunCommitMode = 'allow' | 'forbid'
export type PipelineRunStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'

export interface PipelineRunStepResponse {
  activity_id: string
  status: PipelineRunStepStatus
  activity_run_id: string | null
}

export interface PipelineRunEventResponse {
  id: string
  event_type: string
  activity_id: string | null
  actor_id: string
  payload: Record<string, unknown>
  created_at: string
}

export interface PipelineRunResponse {
  id: string
  pipeline_id: string
  input: string
  commit_mode: PipelineRunCommitMode
  status: PipelineRunStatus
  current_activity_run: ActivityRunResponse | null
  steps: PipelineRunStepResponse[]
  created_at: string
  created_by: string
  updated_at: string
}

export interface PipelineRunCreateRequest {
  input: string
  commit_mode?: PipelineRunCommitMode
}

export interface PipelineRunContinueRequest {
  lease_token: string | null
}

export interface PipelineRunListQuery extends ApiListQuery {
  pipeline_id?: string
  status?: PipelineRunStatus
  created_from?: string
  created_to?: string
}

export interface PipelineRunClaimableResponse {
  run: PipelineRunResponse
  etag: string
}

export type PipelineRunEventListResponse = ApiListResponse<PipelineRunEventResponse>
export type PipelineRunClaimableListResponse = ApiListResponse<PipelineRunClaimableResponse>
export type PipelineRunListResponse = ApiListResponse<PipelineRunResponse>
