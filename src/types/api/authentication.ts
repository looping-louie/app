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
