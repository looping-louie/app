import type { PipelineRunResponse } from '~/types/api'
import { needsTerminalEventRefresh, type PipelineRunSnapshot } from '~/utils/pipelineRuns'

const LIVE_POLL_DELAY = 2500
const MAX_PASSIVE_POLL_DELAY = 30000
const CATALOG_POLL_DELAY = 30000

interface PipelineRunPollingOptions {
  refreshCatalog?: () => Promise<void>
}

export function usePipelineRunPolling(
  getSnapshots: () => PipelineRunSnapshot[],
  updateRuns: (runs: PipelineRunResponse[]) => void | Promise<void>,
  options: PipelineRunPollingOptions = {},
) {
  const api = useApiClient()
  const staleScopes = ref<string[]>([])
  const isRefreshing = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let polling = false
  let passivePollCount = 0
  let lastCatalogRefreshAt = Date.now()

  const isStale = computed(() => staleScopes.value.length > 0)

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  function nextDelay() {
    const snapshots = getSnapshots()
    let runDelay: number | null = null
    if (snapshots.some(snapshot => (
      ['queued', 'claimed', 'in_progress'].includes(snapshot.run.status)
      || needsTerminalEventRefresh(snapshot)
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

  async function fetchRun(run: PipelineRunResponse) {
    return api.pipelines.getRun(run.pipeline_id, run.id)
  }

  function setScopeStale(scope: string, stale: boolean) {
    const scopes = new Set(staleScopes.value)
    if (stale) scopes.add(scope)
    else scopes.delete(scope)
    staleScopes.value = [...scopes]
  }

  async function applyRunUpdates(updates: PipelineRunResponse[]) {
    if (!updates.length) return true
    try {
      await updateRuns(updates)
      setScopeStale('runs', false)
      return true
    } catch {
      setScopeStale('runs', true)
      return false
    }
  }

  async function poll(forceCatalog = false) {
    if (polling || (!forceCatalog && document.hidden)) return
    const candidates = getSnapshots().filter(snapshot => (
      ['prepared', 'queued', 'claimed', 'in_progress', 'waiting'].includes(snapshot.run.status)
      || needsTerminalEventRefresh(snapshot)
    ))
    polling = true
    isRefreshing.value = true
    try {
      const results = await Promise.allSettled(candidates.map(snapshot => fetchRun(snapshot.run)))
      const updates = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
      await applyRunUpdates(updates)
      if (results.some(result => result.status === 'rejected')) setScopeStale('runs', true)

      const catalogDue = forceCatalog || Date.now() - lastCatalogRefreshAt >= CATALOG_POLL_DELAY
      if (options.refreshCatalog && catalogDue) {
        lastCatalogRefreshAt = Date.now()
        try {
          await options.refreshCatalog()
          setScopeStale('catalog', false)
          setScopeStale('runs', false)
        } catch {
          setScopeStale('catalog', true)
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
      const refreshed = await fetchRun(run)
      await applyRunUpdates([refreshed])
      schedule()
      return refreshed
    } catch (cause) {
      setScopeStale('runs', true)
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
    refresh: () => poll(true),
    refreshRun,
  }
}
