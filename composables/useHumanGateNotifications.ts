import { apiErrorMessage } from '~/utils/api/errors'
import { humanGateNotifications } from '~/utils/humanGateNotifications'
import { collectProjectPipelineRuns } from '~/utils/pipelineRunCatalog'

const HUMAN_GATE_POLL_DELAY = 10000

type HumanGateNotificationStatus = 'idle' | 'pending' | 'success' | 'error'

export function useHumanGateNotifications() {
  const api = useApiClient()
  const projectContext = useProjectContext()
  const notifications = useState('human-gate-notifications', () => humanGateNotifications([], []))
  const status = useState<HumanGateNotificationStatus>('human-gate-notification-status', () => 'idle')
  const error = useState('human-gate-notification-error', () => '')
  let timer: ReturnType<typeof setTimeout> | undefined
  let polling = false

  async function refresh() {
    if (polling) return
    polling = true
    status.value = notifications.value.length ? 'success' : 'pending'
    error.value = ''
    try {
      await projectContext.initialize()
      const projectRuns = await collectProjectPipelineRuns(
        projectContext.projects.value.map(project => project.id),
        (projectId, offset) => api.pipelineRuns.list(projectId, { offset }),
      )
      notifications.value = humanGateNotifications(projectContext.projects.value, projectRuns)
      status.value = 'success'
    } catch (cause) {
      error.value = apiErrorMessage(cause, 'Human-gate notifications could not be refreshed.')
      status.value = 'error'
    } finally {
      polling = false
    }
  }

  function schedule() {
    clearTimer()
    if (!import.meta.client || document.hidden) return
    timer = setTimeout(async () => {
      await refresh()
      schedule()
    }, HUMAN_GATE_POLL_DELAY)
  }

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  function handleVisibility() {
    if (document.hidden) clearTimer()
    else void refresh().finally(schedule)
  }

  function startPolling() {
    if (!import.meta.client) return
    document.addEventListener('visibilitychange', handleVisibility)
    void refresh().finally(schedule)
  }

  function stopPolling() {
    clearTimer()
    if (import.meta.client) document.removeEventListener('visibilitychange', handleVisibility)
  }

  return {
    error: readonly(error),
    notifications: readonly(notifications),
    refresh,
    startPolling,
    status: readonly(status),
    stopPolling,
  }
}
