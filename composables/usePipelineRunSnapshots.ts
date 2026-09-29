import type { PipelineRunResponse } from '~/types/api'
import { collectApiPages } from '~/utils/apiPagination'
import { needsTerminalEventRefresh, type PipelineRunSnapshot } from '~/utils/pipelineRuns'

export function usePipelineRunSnapshots() {
  const api = useApiClient()

  async function load(run: PipelineRunResponse, projectId: string): Promise<PipelineRunSnapshot> {
    const events = await collectApiPages(offset => api.pipelines.listRunEvents(run.pipeline_id, run.id, projectId, { offset }))
    return { run, events, projectId }
  }

  function needsEvents(current: PipelineRunSnapshot | undefined, run: PipelineRunResponse) {
    return !current
      || current.run.status !== run.status
      || current.run.updated_at !== run.updated_at
      || needsTerminalEventRefresh(current)
  }

  async function merge(
    current: PipelineRunSnapshot[],
    runs: PipelineRunResponse[],
    replace = false,
  ) {
    const currentById = new Map(current.map(snapshot => [snapshot.run.id, snapshot]))
    const refreshed = await Promise.all(runs.map((run) => {
      const snapshot = currentById.get(run.id)
      return needsEvents(snapshot, run) ? load(run, snapshot!.projectId) : { ...snapshot!, run }
    }))
    if (replace) return refreshed
    const refreshedById = new Map(refreshed.map(snapshot => [snapshot.run.id, snapshot]))
    return current.map(snapshot => refreshedById.get(snapshot.run.id) ?? snapshot)
  }

  return { load, merge }
}
