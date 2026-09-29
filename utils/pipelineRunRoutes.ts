export interface PipelineRunRouteTarget {
  projectId: string
  pipelineId: string
  runId: string
}

export function pipelineRunDetailRoute(
  { projectId, pipelineId, runId }: PipelineRunRouteTarget,
  hash?: string,
) {
  const query = new URLSearchParams({
    project: projectId,
    pipeline: pipelineId,
  })
  return `/runs/${encodeURIComponent(runId)}?${query.toString()}${hash ? `#${hash}` : ''}`
}