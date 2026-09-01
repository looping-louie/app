import type { ApiListQuery, ApiListResponse } from './common'

export type ActivityRunStatus = 'in_progress' | 'failed' | 'completed' | 'stopped'
export type ActivityRunState = 'awaiting_snapshot' | 'awaiting_generation' | 'awaiting_apply' | 'awaiting_harness' | 'awaiting_review_input' | 'awaiting_commit' | 'awaiting_human_decision' | 'completed' | 'failed'
export type ActivityRunAction = 'collect_snapshot' | 'apply_operations' | 'run_harness' | 'submit_review_input' | 'commit_if_allowed' | 'submit_human_decision' | 'none'

export interface HarnessTurnIdentity {
  kind: string
  version: string
  config: Record<string, unknown>
}

export interface HarnessTurnUsage {
  [counter: string]: number | undefined
}

export interface HarnessTurnObservationBase<THarness extends HarnessTurnIdentity = HarnessTurnIdentity> {
  schema_version: 'v1'
  harness: THarness
  completed: boolean
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  requested_model: string | null
  actual_model: string | null
  usage: HarnessTurnUsage
  exit_code: number | null
  diagnostics: string[]
  source_commit_sha: string | null
  final_commit_sha: string | null
  final_diff: string
  changed_files: string[]
  final_response: string
  error: string | null
  commit_message?: string
  committed?: boolean
  commit_error?: string
}

export interface CodexMaterializedSkill {
  id: string
  name: string
  version: number
}

export interface CodexCliTurnObservation extends HarnessTurnObservationBase<{
  kind: 'codex_cli'
  version: 'v1'
  config: Record<string, never>
}> {
  requested_model: string
  reasoning_effort: string | null
  session_reference: string | null
  materialized_skills: CodexMaterializedSkill[]
}

export type HarnessTurnObservation = CodexCliTurnObservation

export interface ActivityRunResponse {
  id: string
  activity_id: string
  input: string
  status: ActivityRunStatus
  state: ActivityRunState
  next_action: ActivityRunAction
  iteration: number
  token_revision: number
  continuation_token: string | null
  created_at: string
  created_by: string
  updated_at: string
  payload: unknown
}

export type ActivityRunListResponse = ApiListResponse<ActivityRunResponse>

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

export interface PipelineRunEventResponse<TPayload = unknown, TEventType extends string = string> {
  id: string
  event_type: TEventType
  activity_id: string | null
  actor_id: string
  payload: TPayload
  created_at: string
}

export type HarnessTurnOutcome = 'completed' | 'failed'
export type HarnessTurnCompletedEventType = 'harness_turn_completed' | 'codex_turn_completed'
export type HarnessTurnFailedEventType = 'harness_turn_failed' | 'codex_turn_failed'

export type HarnessTurnEvent =
  | PipelineRunEventResponse<
    CodexCliTurnObservation & { activity_run_id: string },
    HarnessTurnCompletedEventType
  >
  | PipelineRunEventResponse<
    CodexCliTurnObservation & { activity_run_id: string },
    HarnessTurnFailedEventType
  >

export type SchedulerEvent =
  | PipelineRunEventResponse<{ commit_mode: PipelineRunCommitMode }, 'pipeline_run_created'>
  | PipelineRunEventResponse<{
    worker_id: string
    attempt: number
    activity_run_id: string
    lease_expires_at: string | null
  }, 'pipeline_run_claimed'>
  | PipelineRunEventResponse<{
    activity_run_id: string
    position: number
    harness: HarnessTurnIdentity | null
  }, 'pipeline_step_started'>
  | PipelineRunEventResponse<{
    activity_run_id: string
    status: 'completed'
    started_at: string
    completed_at: string
  }, 'pipeline_step_completed'>
  | PipelineRunEventResponse<{
    activity_run_id: string
    status: 'failed'
    started_at: string
    completed_at: string
  }, 'pipeline_step_failed'>

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

export type PipelineRunEventListResponse = ApiListResponse<PipelineRunEventResponse>
export type PipelineRunListResponse = ApiListResponse<PipelineRunResponse>
