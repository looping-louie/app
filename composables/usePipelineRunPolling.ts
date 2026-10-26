import type { PipelineRunResponse } from '~/types/api'
import { apiErrorSummary } from '~/utils/api/errors'
import { needsTerminalEventRefresh, type PipelineRunSnapshot, type PipelineRunSummary } from '~/utils/pipelineRuns'

const LIVE_POLL_DELAY = 2500
const MAX_PASSIVE_POLL_DELAY = 30000
const CATALOG_POLL_DELAY = 30000

interface PipelineRunPollingOptions {
  refreshCatalog?: () => Promise<void>
}

export function usePipelineRunPolling(
  getSnapshots: () => Array<PipelineRunSnapshot | PipelineRunSummary>,
  updateRuns: (runs: PipelineRunResponse[]) => void | Promise<void>,
  options: PipelineRunPollingOptions = {},
) {
  const api = useApiClient()
  const staleFailures = ref<Record<string, string>>({})
  const isRefreshing = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let polling = false
  let passivePollCount = 0
  let lastCatalogRefreshAt = Date.now()

  const isStale = computed(() => Object.keys(staleFailures.value).length > 0)
  const staleMessage = computed(() => Object.values(staleFailures.value).join(' '))

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  function nextDelay() {
    const snapshots = getSnapshots()
    let runDelay: number | null = null
    if (snapshots.some(snapshot => (
      ['queued', 'claimed', 'in_progress'].includes(snapshot.run.status)
      || ('events' in snapshot && needsTerminalEventRefresh(snapshot))
    ))) {
      passivePollCount = 0
      runDelay = LIVE_POLL_DELAY
    }
    else if (snapshots.some(snapshot => snapshot.run.status === 'prepared' || snapshot.run.status === 'waiting')) {
      runDelay = Math.min(LIVE_POLL_DELAY * 2 ** passivePollCount, MAX_PASSIVE_POLL_DELAY)
      passivePollCount += 1
    }
    else {
      passivePollCount = 0
    }

    const catalogDelay = options.refreshCatalog
      ? Math.max(CATALOG_POLL_DELAY - (Date.now() - lastCatalogRefreshAt), 0)
      : null
    if (runDelay === null) return catalogDelay
    if (catalogDelay === null) return runDelay
    return Math.min(runDelay, catalogDelay)
  }

  function schedule() {
    clearTimer()
    if (!import.meta.client || document.hidden) return
    const delay = nextDelay()
    if (delay === null) return
    timer = setTimeout(poll, delay)
  }

  async function fetchRun(snapshot: PipelineRunSummary) {
    return api.pipelines.getRun(snapshot.run.pipeline_id, snapshot.run.id, snapshot.projectId)
  }

  function setScopeFailure(scope: string, message: string | null) {
    const failures = { ...staleFailures.value }
    if (message) failures[scope] = message
    else delete failures[scope]
    staleFailures.value = failures
  }

  function refreshFailure(operation: string, cause: unknown) {
    return `${operation} failed: ${apiErrorSummary(cause)} Last known data remains visible.`
  }

  async function applyRunUpdates(updates: PipelineRunResponse[]) {
    if (!updates.length) return true
    try {
      await updateRuns(updates)
      setScopeFailure('events', null)
      return true
    } catch (cause) {
      setScopeFailure('events', refreshFailure('Run event refresh', cause))
      return false
    }
  }

  async function poll(forceCatalog = false) {
    if (polling || (!forceCatalog && document.hidden)) return
    const candidates = getSnapshots().filter(snapshot => (
      ['prepared', 'queued', 'claimed', 'in_progress', 'waiting'].includes(snapshot.run.status)
      || ('events' in snapshot && needsTerminalEventRefresh(snapshot))
    ))
    polling = true
    isRefreshing.value = true
    try {
      const results = await Promise.allSettled(candidates.map(fetchRun))
      const updates = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
      await applyRunUpdates(updates)
      const failedRun = results.find(result => result.status === 'rejected')
      setScopeFailure(
        'runs',
        failedRun?.status === 'rejected' ? refreshFailure('Run status refresh', failedRun.reason) : null,
      )

      const catalogDue = forceCatalog || Date.now() - lastCatalogRefreshAt >= CATALOG_POLL_DELAY
      if (options.refreshCatalog && catalogDue) {
        lastCatalogRefreshAt = Date.now()
        try {
          await options.refreshCatalog()
          setScopeFailure('catalog', null)
        } catch (cause) {
          setScopeFailure('catalog', refreshFailure('Run catalog refresh', cause))
        }
      }
    } finally {
      polling = false
      isRefreshing.value = false
      schedule()
    }
  }

  async function refreshRun(run: PipelineRunResponse) {
    isRefreshing.value = true
    try {
      const snapshot = getSnapshots().find(candidate => candidate.run.id === run.id)
      if (!snapshot) throw new Error('The run project context is unavailable.')
      const refreshed = await fetchRun(snapshot)
      setScopeFailure('runs', null)
      await applyRunUpdates([refreshed])
      schedule()
      return refreshed
    } catch (cause) {
      setScopeFailure('runs', refreshFailure('Run status refresh', cause))
      throw cause
    } finally {
      isRefreshing.value = false
    }
  }

  function handleVisibility() {
    if (document.hidden) clearTimer()
    else void poll(Date.now() - lastCatalogRefreshAt >= CATALOG_POLL_DELAY)
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibility)
    schedule()
  })
  onBeforeUnmount(() => {
    clearTimer()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return {
    applyRunUpdates,
    isRefreshing: readonly(isRefreshing),
    isStale,
    staleMessage,
    refresh: () => poll(true),
    refreshRun,
  }
}
