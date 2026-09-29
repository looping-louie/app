import type { PipelineRunResponse, ProjectResponse } from '~/types/api'
import type { ProjectPipelineRun } from '~/utils/pipelineRunCatalog'
import { pipelineRunDetailRoute } from '~/utils/pipelineRunRoutes'

export interface HumanGateNotification {
  id: string
  projectId: string
  projectName: string
  pipelineId: string
  runId: string
  runLabel: string
  updatedAt: string
  to: string
}

export function humanGateNotifications(
  projects: Pick<ProjectResponse, 'id' | 'name'>[],
  projectRuns: ProjectPipelineRun[],
): HumanGateNotification[] {
  const projectNames = new Map(projects.map(project => [project.id, project.name]))

  return projectRuns
    .filter(({ run }) => run.status === 'waiting')
    .map(({ projectId, run }) => ({
      id: `${projectId}:${run.id}`,
      projectId,
      projectName: projectNames.get(projectId) ?? projectId,
      pipelineId: run.pipeline_id,
      runId: run.id,
      runLabel: humanGateRunLabel(run),
      updatedAt: run.updated_at,
      to: humanGateRoute(projectId, run),
    }))
    .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
}

export function humanGateRoute(projectId: string, run: PipelineRunResponse) {
  return pipelineRunDetailRoute({
    projectId,
    pipelineId: run.pipeline_id,
    runId: run.id,
  }, 'human-gate')
}

function humanGateRunLabel(run: PipelineRunResponse) {
  return run.input.trim().split('\n')[0]?.slice(0, 90) || `Run ${run.id}`
}
