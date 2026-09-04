import type { ApiListResponse } from './common'
import type {
  ActivityCreateRequest,
  ActivityResponse,
} from './activities'
import type { ExecutionHarness } from './execution'

export type PipelineStatus = 'active' | 'disabled' | 'archived'

export interface PipelineStepDependencyRequest {
  activity: string
  condition: 'success' | 'failure'
}

export type PipelineActivityStepRequest = ActivityCreateRequest & {
  dependsOn: PipelineStepDependencyRequest[]
}

export interface PipelineCreateRequest {
  name: string
  description: string
  steps: PipelineActivityStepRequest[]
  model_id?: string | null
  harness?: ExecutionHarness | null
}

export interface PipelinePatchRequest {
  name?: string
  description?: string
  enabled?: boolean
  steps?: PipelineActivityStepRequest[]
  model_id?: string | null
  harness?: ExecutionHarness | null
}

export interface PipelineStepDependencyResponse {
  activity: string
  condition: 'success' | 'failure'
}

export type PipelineActivityStepResponse = ActivityResponse & {
  dependsOn: PipelineStepDependencyResponse[]
}

export interface PipelineListItemResponse {
  id: string
  name: string
  description: string
  enabled: boolean
  model_id: string | null
  harness: ExecutionHarness | null
  steps: PipelineActivityStepResponse[]
  created_at: string
  updated_at: string
}

export type PipelineResponse = PipelineListItemResponse

export interface PipelineListQuery {
  offset?: number
  status?: PipelineStatus
  search?: string
}

export type PipelineListResponse = ApiListResponse<PipelineListItemResponse>
