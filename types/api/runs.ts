import type { ApiListResponse } from './common'

export type LoopRunStatus = 'in_progress' | 'failed' | 'completed' | 'stopped'
export type LoopRunState = 'awaiting_snapshot' | 'awaiting_generation' | 'awaiting_apply' | 'awaiting_review_input' | 'awaiting_commit' | 'completed' | 'failed'
export type LoopRunAction = 'collect_snapshot' | 'apply_operations' | 'submit_review_input' | 'commit_if_allowed' | 'none'

export interface LoopRunResponse {
  id: string
  loop_id: string
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

export type LoopRunListResponse = ApiListResponse<LoopRunResponse>

export type PipelineRunStatus = 'pending' | 'claimed' | 'running' | 'completed' | 'failed'
export type GateDecisionStatus = 'waiting' | 'approved' | 'rejected' | 'cancelled'

export interface PipelineRunEventResponse {
  id: string
  type: string
  step_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface PipelineRunResponse {
  id: string
  pipeline_id: string
  input: Record<string, unknown>
  status: PipelineRunStatus
  worker_id: string | null
  result: Record<string, unknown> | null
  error: Record<string, unknown> | null
  created_at: string
  created_by: string
  claimed_at: string | null
  started_at: string | null
  finished_at: string | null
  updated_at: string
  events: PipelineRunEventResponse[]
}

export interface PipelineRunCreateRequest {
  input: Record<string, unknown>
}

export interface GateDecisionRequest {
  status: Exclude<GateDecisionStatus, 'waiting'>
  comment?: string | null
}

export interface GateDecisionResponse {
  run_id: string
  step_id: string
  status: GateDecisionStatus
  comment: string | null
  decided_by: string | null
  decided_at: string | null
}

export type PipelineRunListResponse = ApiListResponse<PipelineRunResponse>
