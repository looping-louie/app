export type AccountRole = 'admin' | 'member'

export interface SessionUserResponse {
  id: string
  username: string
  role: AccountRole
}

export interface SetupStatusResponse {
  setup_required: boolean
}

export interface SessionStatusResponse {
  setup_required: boolean
  user: SessionUserResponse | null
}

export interface AccountCredentialsRequest {
  username: string
  password: string
}

export interface LocalAccountResponse extends SessionUserResponse {
  is_active: boolean
}

export interface MemberAccountActivationRequest {
  is_active: boolean
}

export interface PersonalAccessTokenCreateRequest {
  name: string
  expires_at?: string | null
}

export interface PersonalAccessTokenResponse {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export interface PersonalAccessTokenCreatedResponse extends PersonalAccessTokenResponse {
  token: string
}

export interface ServiceAccountCreateRequest {
  name: string
  project_ids: string[]
  expires_at?: string | null
}

export interface ServiceAccountResponse {
  id: string
  name: string
  project_ids: string[]
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export interface ServiceAccountCreatedResponse extends ServiceAccountResponse {
  token: string
}
