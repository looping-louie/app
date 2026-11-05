import type {
  AccountCredentialsRequest,
  SessionStatusResponse,
  SessionUserResponse,
} from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

type AuthSessionStatus = 'idle' | 'pending' | 'ready' | 'error'

export function useAuthSession() {
  const requestFetch = useRequestFetch()
  const user = useState<SessionUserResponse | null>('auth-session-user', () => null)
  const setupRequired = useState('auth-session-setup-required', () => false)
  const status = useState<AuthSessionStatus>('auth-session-status', () => 'idle')
  const error = useState<string>('auth-session-error', () => '')

  async function refresh() {
    status.value = 'pending'
    error.value = ''
    try {
      applySessionStatus(await requestFetch<SessionStatusResponse>('/api/v1/auth/session'))
      status.value = 'ready'
    } catch (cause) {
      user.value = null
      setupRequired.value = false
      error.value = apiErrorMessage(cause, 'Your session could not be checked.')
      status.value = 'error'
    }
  }

  async function setup(credentials: AccountCredentialsRequest) {
    applySessionStatus(await requestFetch<SessionStatusResponse>('/api/v1/auth/setup', {
      method: 'POST',
      body: credentials,
    }))
    status.value = 'ready'
  }

  async function login(credentials: AccountCredentialsRequest) {
    applySessionStatus(await requestFetch<SessionStatusResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: credentials,
    }))
    status.value = 'ready'
  }

  async function logout() {
    await requestFetch('/api/v1/auth/logout', { method: 'POST' })
    user.value = null
    status.value = 'ready'
  }

  function applySessionStatus(session: SessionStatusResponse) {
    user.value = session.user
    setupRequired.value = session.setup_required
  }

  return {
    error,
    login,
    logout,
    refresh,
    setup,
    setupRequired,
    status,
    user,
  }
}
