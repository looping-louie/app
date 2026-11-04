export interface ProjectCreateRequest {
  name: string
}

export interface ProjectPatchRequest {
  name: string
}

export interface ProjectResponse {
  id: string
  name: string
  created_at: string
  updated_at: string
}
