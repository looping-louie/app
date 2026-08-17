import type { PipelineRunResponse } from '~/types/api'

const LIVE_POLL_DELAY = 2500
const MAX_PENDING_POLL_DELAY = 30000

export function usePipelineRunPolling(
  getRuns: () => PipelineRunResponse[],
  updateRuns: (runs: PipelineRunResponse[]) => void,
) {
  const api = useApiClient()
  let timer: ReturnType<typeof setTimeout> | undefined
  let polling = false
  let pendingPollCount = 0

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  function nextDelay() {
    const runs = getRuns()
    if (runs.some(run => run.status === 'claimed' || run.status === 'running')) {
      pendingPollCount = 0
      return LIVE_POLL_DELAY
    }
    if (runs.some(run => run.status === 'pending')) {
      const delay = Math.min(2500 * 2 ** pendingPollCount, MAX_PENDING_POLL_DELAY)
      pendingPollCount += 1
      return delay
    }
    pendingPollCount = 0
    return null
  }

  function schedule() {
    clearTimer()
    if (!import.meta.client || document.hidden) return
    const delay = nextDelay()
    if (delay === null) return
    timer = setTimeout(poll, delay)
  }

  async function fetchRun(run: PipelineRunResponse) {
    return api.pipelines.getRun(run.pipeline_id, run.id)
  }

  async function poll() {
    if (polling || document.hidden) return
    const active = getRuns().filter(run => ['pending', 'claimed', 'running'].includes(run.status))
    if (!active.length) return
    polling = true
    try {
      const results = await Promise.allSettled(active.map(fetchRun))
      const updates = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
      if (updates.length) updateRuns(updates)
    } finally {
      polling = false
      schedule()
    }
  }

  async function refreshRun(run: PipelineRunResponse) {
    const refreshed = await fetchRun(run)
    updateRuns([refreshed])
    schedule()
    return refreshed
  }

  function handleVisibility() {
    if (document.hidden) clearTimer()
    else void poll()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibility)
    schedule()
  })
  onBeforeUnmount(() => {
    clearTimer()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return { refreshRun }
}
