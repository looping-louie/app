import type {
  ActivityCreateRequest,
  ActivityRunContinueRequest,
  ActivityRunResponse,
  ActivityListResponse,
  ActivityPatchRequest,
  ActivityResponse,
  ApiDeleteResponse,
  ApiListQuery,
  ActivityRunListResponse,
  ModelListQuery,
  ModelListResponse,
  ModelResponse,
  PersonaListResponse,
  PersonaListQuery,
  PersonaCreateRequest,
  PersonaPatchRequest,
  PersonaResponse,
  PipelineCreateRequest,
  PipelineListQuery,
  PipelineListResponse,
  PipelinePatchRequest,
  PipelineResponse,
  PipelineRunCreateRequest,
  PipelineRunContinueRequest,
  PipelineRunEventListResponse,
  PipelineRunListQuery,
  PipelineRunListResponse,
  PipelineRunResponse,
  CatalogProviderResponse,
  CatalogPersonaResponse,
  CatalogSkillResponse,
  LinkedServiceCreateRequest,
  LinkedServicePatchRequest,
  LinkedServiceResponse,
  SkillListResponse,
  SkillListQuery,
  SkillCreateRequest,
  SkillResponse,
  UserResponse,
  UserSettingsRequest,
  WorkspaceCreateRequest,
  WorkspacePatchRequest,
  WorkspaceResponse,
} from '~/types/api'

const resourcePath = (collection: string, id: string) => `/api/v1/${collection}/${encodeURIComponent(id)}`

export function useApiClient() {
  const activeWorkspaceId = useCookie<string | null>('looping-louie-workspace-id')
  const workspaceOptions = () => activeWorkspaceId.value
    ? { headers: { 'X-Workspace-ID': activeWorkspaceId.value } }
    : {}

  return {
    activities: {
      list: (query: ApiListQuery = {}) => $fetch<ActivityListResponse>('/api/v1/activities', { query }),
      get: (id: string) => $fetch<ActivityResponse>(resourcePath('activities', id)),
      create: (body: ActivityCreateRequest) => $fetch<ActivityResponse>('/api/v1/activities', { method: 'POST', body }),
      patch: (id: string, body: ActivityPatchRequest) => $fetch<ActivityResponse>(resourcePath('activities', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('activities', id), { method: 'DELETE' }),
      listRuns: (id: string, query: ApiListQuery = {}) => $fetch<ActivityRunListResponse>(`${resourcePath('activities', id)}/runs`, { ...workspaceOptions(), query }),
      continueRun: (activityId: string, runId: string, body: ActivityRunContinueRequest) => $fetch<ActivityRunResponse>(`${resourcePath('activities', activityId)}/runs/${encodeURIComponent(runId)}/continue`, { ...workspaceOptions(), method: 'POST', body }),
    },
    pipelines: {
      list: (query: PipelineListQuery = {}) => $fetch<PipelineListResponse>('/api/v1/pipelines', { query }),
      get: (id: string) => $fetch<PipelineResponse>(resourcePath('pipelines', id)),
      create: (body: PipelineCreateRequest) => $fetch<PipelineResponse>('/api/v1/pipelines', { method: 'POST', body }),
      patch: (id: string, body: PipelinePatchRequest) => $fetch<PipelineResponse>(resourcePath('pipelines', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('pipelines', id), { method: 'DELETE' }),
      createRun: (id: string, body: PipelineRunCreateRequest) => $fetch<PipelineRunResponse>(`${resourcePath('pipelines', id)}/runs`, { ...workspaceOptions(), method: 'POST', body }),
      startRun: (pipelineId: string, runId: string) => $fetch<PipelineRunResponse>(`${resourcePath('pipelines', pipelineId)}/runs/${encodeURIComponent(runId)}/start`, { ...workspaceOptions(), method: 'POST' }),
      continueRun: (pipelineId: string, runId: string, body: PipelineRunContinueRequest) => $fetch<PipelineRunResponse>(`${resourcePath('pipelines', pipelineId)}/runs/${encodeURIComponent(runId)}/continue`, { ...workspaceOptions(), method: 'POST', body }),
      getRun: (pipelineId: string, runId: string) => $fetch<PipelineRunResponse>(`${resourcePath('pipelines', pipelineId)}/runs/${encodeURIComponent(runId)}`, workspaceOptions()),
      listRunEvents: (pipelineId: string, runId: string) => $fetch<PipelineRunEventListResponse>(`${resourcePath('pipelines', pipelineId)}/runs/${encodeURIComponent(runId)}/events`, workspaceOptions()),
    },
    pipelineRuns: {
      list: (query: PipelineRunListQuery = {}) => $fetch<PipelineRunListResponse>('/api/v1/pipeline-runs', { ...workspaceOptions(), query }),
    },
    personas: {
      list: (query: PersonaListQuery = {}) => $fetch<PersonaListResponse>('/api/v1/personas', { query }),
      get: (id: string) => $fetch<PersonaResponse>(resourcePath('personas', id)),
      create: (body: PersonaCreateRequest) => $fetch<PersonaResponse>('/api/v1/personas', { method: 'POST', body }),
      patch: (id: string, body: PersonaPatchRequest) => $fetch<PersonaResponse>(resourcePath('personas', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('personas', id), { method: 'DELETE' }),
    },
    skills: {
      list: (query: SkillListQuery = {}) => $fetch<SkillListResponse>('/api/v1/skills', { query }),
      get: (id: string) => $fetch<SkillResponse>(resourcePath('skills', id)),
      create: (body: SkillCreateRequest) => $fetch<SkillResponse>('/api/v1/skills', { method: 'POST', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('skills', id), { method: 'DELETE' }),
    },
    models: {
      list: (query: ModelListQuery = {}) => $fetch<ModelListResponse>('/api/v1/users/me/models', { query }),
      get: (id: string) => $fetch<ModelResponse>(`/api/v1/users/me/models/${encodeURIComponent(id)}`),
    },
    users: {
      registerCurrent: () => $fetch<UserResponse>('/api/v1/users', { method: 'POST' }),
      getCurrent: () => $fetch<UserResponse>('/api/v1/users/me'),
      replaceSettings: (body: UserSettingsRequest) => $fetch<UserResponse>('/api/v1/users/me', { method: 'PATCH', body }),
    },
    catalog: {
      listProviders: (signal?: AbortSignal) => $fetch<CatalogProviderResponse[]>('/api/v1/catalog/providers', { signal }),
      listPersonas: (signal?: AbortSignal) => $fetch<CatalogPersonaResponse[]>('/api/v1/catalog/personas', { signal }),
      listSkills: (signal?: AbortSignal) => $fetch<CatalogSkillResponse[]>('/api/v1/catalog/skills', { signal }),
    },
    workspaces: {
      list: () => $fetch<WorkspaceResponse[]>('/api/v1/workspaces'),
      get: (id: string) => $fetch<WorkspaceResponse>(resourcePath('workspaces', id)),
      create: (body: WorkspaceCreateRequest) => $fetch<WorkspaceResponse>('/api/v1/workspaces', { method: 'POST', body }),
      patch: (id: string, body: WorkspacePatchRequest) => $fetch<WorkspaceResponse>(resourcePath('workspaces', id), { method: 'PATCH', body }),
    },
    linkedServices: {
      list: (signal?: AbortSignal) => $fetch<LinkedServiceResponse[]>('/api/v1/linked-services', { signal }),
      get: (id: string) => $fetch<LinkedServiceResponse>(resourcePath('linked-services', id)),
      create: (body: LinkedServiceCreateRequest) => $fetch<LinkedServiceResponse>('/api/v1/linked-services', { method: 'POST', body }),
      patch: (id: string, body: LinkedServicePatchRequest) => $fetch<LinkedServiceResponse>(resourcePath('linked-services', id), { method: 'PATCH', body }),
      remove: (id: string) => $fetch<ApiDeleteResponse>(resourcePath('linked-services', id), { method: 'DELETE' }),
    },
  }
}
