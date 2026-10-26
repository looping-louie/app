import type { ActivityResponse } from '~/types/api'
import type { PipelineRunSnapshot } from '~/utils/pipelineRuns'

export interface PipelineRunDetailData {
  snapshot: PipelineRunSnapshot
  pipelineName: string
  activitiesById: Map<string, ActivityResponse>
}

export function usePipelineRunDetails() {
  const api = useApiClient()
  const { load: loadSnapshot } = usePipelineRunSnapshots()

  async function load(
    pipelineId: string,
    runId: string,
    projectId: string,
  ): Promise<PipelineRunDetailData> {
    const run = await api.pipelines.getRun(pipelineId, runId, projectId)
    const pipeline = await api.pipelines.get(run.pipeline_id)
    return {
      snapshot: await loadSnapshot(run, projectId),
      pipelineName: pipeline.name,
      activitiesById: new Map(pipeline.steps.map(step => [step.id, step] as const)),
    }
  }

  return { load }
}
