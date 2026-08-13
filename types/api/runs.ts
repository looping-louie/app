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
