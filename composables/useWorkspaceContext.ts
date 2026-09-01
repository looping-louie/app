import type { WorkspaceCreateRequest, WorkspaceResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

type WorkspaceContextStatus = 'idle' | 'pending' | 'success' | 'error'

export function useWorkspaceContext() {
  const api = useApiClient()
  const workspaces = useState<WorkspaceResponse[]>('workspace-context-items', () => [])
  const status = useState<WorkspaceContextStatus>('workspace-context-status', () => 'idle')
  const error = useState<string>('workspace-context-error', () => '')
  const userRegistered = useState('workspace-context-user-registered', () => false)
  const activeWorkspaceId = useCookie<string | null>('looping-louie-workspace-id', {
    default: () => null,
    sameSite: 'lax',
  })

  const activeWorkspace = computed(() => (
    workspaces.value.find(workspace => workspace.id === activeWorkspaceId.value) ?? null
  ))

  async function initialize(force = false) {
    if (!force && (status.value === 'pending' || status.value === 'success')) return
    status.value = 'pending'
    error.value = ''
    try {
      if (!userRegistered.value) {
        await api.users.registerCurrent()
        userRegistered.value = true
      }
      workspaces.value = await api.workspaces.list()
      const activeIsAccessible = workspaces.value.some(workspace => workspace.id === activeWorkspaceId.value)
      if (!activeIsAccessible) activeWorkspaceId.value = workspaces.value[0]?.id ?? null
      status.value = 'success'
    } catch (cause) {
      error.value = apiErrorMessage(cause, 'Your workspace context could not be loaded.')
      status.value = 'error'
    }
  }

  function selectWorkspace(workspaceId: string) {
    if (!workspaces.value.some(workspace => workspace.id === workspaceId)) return false
    activeWorkspaceId.value = workspaceId
    return true
  }

  async function createWorkspace(payload: WorkspaceCreateRequest) {
    const workspace = await api.workspaces.create(payload)
    workspaces.value = [...workspaces.value, workspace]
    activeWorkspaceId.value = workspace.id
    return workspace
  }

  function replaceWorkspace(workspace: WorkspaceResponse) {
    workspaces.value = workspaces.value.map(candidate => (
      candidate.id === workspace.id ? workspace : candidate
    ))
  }

  return {
    activeWorkspace,
    activeWorkspaceId,
    createWorkspace,
    error,
    initialize,
    replaceWorkspace,
    selectWorkspace,
    status,
    workspaces,
  }
}
