import type {
  ActivityCreateRequest,
  ActivityListResponse,
  ActivityPatchRequest,
  ActivityResponse,
  ApiDeleteResponse,
  ApiListQuery,
  ApiSearchQuery,
  LoopCreateRequest,
  LoopListResponse,
  LoopPatchRequest,
  LoopResponse,
  LoopRunListResponse,
  ModelListQuery,
  ModelListResponse,
  ModelResponse,
  PersonaListResponse,
  PersonaResponse,
  PipelineCreateRequest,
  PipelineListQuery,
  PipelineListResponse,
  PipelinePatchRequest,
  PipelineResponse,
  ProviderPatchRequest,
  ProviderResponse,
  SkillListResponse,
  SkillResponse,
} from '~/types/api'

const resourcePath = (collection: string, id: string) => `/api/v1/${collection}/${encodeURIComponent(id)}`

export function useApiClient() {
  return {
    activities: {
      list: (query: ApiListQuery = {}) => $fetch<ActivityListResponse>('/api/v1/activities', { query }),
      get: (id: string) => $fetch<ActivityResponse>(resourcePath('activities', id)),
      create: (body: ActivityCreateRequest) => $fetch<ActivityResponse>('/api/v1/activities', { method: 'POST', body }),
      patch: (id: string, body: ActivityPatchRequest) => $fetch<ActivityResponse>(resourcePath('activities', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('activities', id), { method: 'DELETE' }),
      listRuns: (id: string, query: ApiListQuery = {}) => $fetch<LoopRunListResponse>(`${resourcePath('activities', id)}/runs`, { query }),
    },
    loops: {
      list: (query: ApiListQuery = {}) => $fetch<LoopListResponse>('/api/v1/loops', { query }),
      get: (id: string) => $fetch<LoopResponse>(resourcePath('loops', id)),
      create: (body: LoopCreateRequest) => $fetch<LoopResponse>('/api/v1/loops', { method: 'POST', body }),
      patch: (id: string, body: LoopPatchRequest) => $fetch<LoopResponse>(resourcePath('loops', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('loops', id), { method: 'DELETE' }),
      listRuns: (id: string, query: ApiListQuery = {}) => $fetch<LoopRunListResponse>(`${resourcePath('loops', id)}/runs`, { query }),
    },
    pipelines: {
      list: (query: PipelineListQuery = {}) => $fetch<PipelineListResponse>('/api/v1/pipelines', { query }),
      get: (id: string) => $fetch<PipelineResponse>(resourcePath('pipelines', id)),
      create: (body: PipelineCreateRequest) => $fetch<PipelineResponse>('/api/v1/pipelines', { method: 'POST', body }),
      patch: (id: string, body: PipelinePatchRequest) => $fetch<PipelineResponse>(resourcePath('pipelines', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('pipelines', id), { method: 'DELETE' }),
    },
    personas: {
      list: (query: ApiSearchQuery = {}) => $fetch<PersonaListResponse>('/api/v1/personas', { query }),
      get: (id: string) => $fetch<PersonaResponse>(resourcePath('personas', id)),
    },
    skills: {
      list: (query: ApiSearchQuery = {}) => $fetch<SkillListResponse>('/api/v1/skills', { query }),
      get: (id: string) => $fetch<SkillResponse>(resourcePath('skills', id)),
    },
    models: {
      list: (query: ModelListQuery = {}) => $fetch<ModelListResponse>('/api/v1/models', { query }),
      get: (id: string) => $fetch<ModelResponse>(resourcePath('models', id)),
    },
    providers: {
      list: () => $fetch<ProviderResponse[]>('/api/v1/providers'),
      get: (id: string) => $fetch<ProviderResponse>(resourcePath('providers', id)),
      patch: (id: string, body: ProviderPatchRequest) => $fetch<ProviderResponse>(resourcePath('providers', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('providers', id), { method: 'DELETE' }),
    },
  }
}
