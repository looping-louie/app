import type { ApiListResponse } from './common'

export type PipelineStatus = 'active' | 'disabled' | 'archived'

export interface PipelineActivityStep {
  activity_id: string
}

export interface PipelineCreateRequest {
  title: string
  description: string
  steps: PipelineActivityStep[]
}

export interface PipelinePatchRequest {
  title?: string
  description?: string
  enabled?: boolean
  steps?: PipelineActivityStep[]
}

export interface PipelineResponse extends PipelineCreateRequest {
  id: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface PipelineListQuery {
  offset?: number
  status?: PipelineStatus
  search?: string
}

export type PipelineListResponse = ApiListResponse<PipelineResponse>
