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
