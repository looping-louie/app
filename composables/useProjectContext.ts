import type { ProjectCreateRequest, ProjectResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

type ProjectContextStatus = 'idle' | 'pending' | 'success' | 'error'

export function useProjectContext() {
  const api = useApiClient()
  const projects = useState<ProjectResponse[]>('project-context-items', () => [])
  const status = useState<ProjectContextStatus>('project-context-status', () => 'idle')
  const error = useState<string>('project-context-error', () => '')
  const userRegistered = useState('project-context-user-registered', () => false)

  async function initialize(force = false) {
    if (!force && (status.value === 'pending' || status.value === 'success')) return
    status.value = 'pending'
    error.value = ''
    try {
      if (!userRegistered.value) {
        await api.users.registerCurrent()
        userRegistered.value = true
      }
      projects.value = await api.projects.list()
      status.value = 'success'
    } catch (cause) {
      error.value = apiErrorMessage(cause, 'Your projects could not be loaded.')
      status.value = 'error'
    }
  }

  async function createProject(payload: ProjectCreateRequest) {
    const project = await api.projects.create(payload)
    projects.value = [...projects.value, project]
    return project
  }

  function replaceProject(project: ProjectResponse) {
    projects.value = projects.value.map(candidate => (
      candidate.id === project.id ? project : candidate
    ))
  }

  return {
    createProject,
    error,
    initialize,
    projects,
    replaceProject,
    status,
  }
}
