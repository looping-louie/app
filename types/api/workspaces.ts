export interface WorkspaceCreateRequest {
  name: string
}

export interface WorkspacePatchRequest {
  name: string
}

export interface WorkspaceResponse {
  id: string
  name: string
  created_at: string
  updated_at: string
}
