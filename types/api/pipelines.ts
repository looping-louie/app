import type { ApiListResponse } from './common'
import type {
  ActivityCreateRequest,
  ActivityResponse,
} from './activities'

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
}

export interface PipelinePatchRequest {
  name?: string
  description?: string
  enabled?: boolean
  steps?: PipelineActivityStepRequest[]
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
