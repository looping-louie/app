import type { ApiListResponse, PipelineRunResponse, PipelineRunStatus, ProjectResponse } from '~/types/api'
import { collectApiPages } from '~/utils/apiPagination'
import type { PipelineRunSnapshot } from '~/utils/pipelineRuns'

export interface ProjectPipelineRun {
  projectId: string
  run: PipelineRunResponse
}

export type PipelineRunDateRange = 'all-time' | 'last-24-hours' | 'last-week' | 'last-month' | 'last-quarter'
export const DEFAULT_PIPELINE_RUN_DATE_RANGE: PipelineRunDateRange = 'all-time'

export function runCatalogProjectIds(
  projects: Pick<ProjectResponse, 'id'>[],
  requestedProjectId: string,
) {
  if (requestedProjectId && projects.some(project => project.id === requestedProjectId)) {
    return [requestedProjectId]
  }
  return projects.map(project => project.id)
}

export async function collectProjectPipelineRuns(
  projectIds: string[],
  fetchPage: (projectId: string, offset: number) => Promise<ApiListResponse<PipelineRunResponse>>,
): Promise<ProjectPipelineRun[]> {
  const projectRuns = await Promise.all(projectIds.map(async projectId => ({
    projectId,
    runs: await collectApiPages(offset => fetchPage(projectId, offset)),
  })))
  return projectRuns.flatMap(({ projectId, runs }) => (
    runs.map(run => ({ projectId, run }))
  ))
}

export function filterPipelineRunSnapshots(
  snapshots: PipelineRunSnapshot[],
  status: PipelineRunStatus | 'all',
  createdFrom?: number,
) {
  return snapshots.filter(({ run }) => (
    (status === 'all' || run.status === status)
    && (createdFrom === undefined || Date.parse(run.created_at) >= createdFrom)
  ))
}

export function pipelineRunCreatedFrom(range: PipelineRunDateRange, now = Date.now()) {
  const duration = rangeDuration(range)
  return duration === undefined ? undefined : new Date(now - duration).toISOString()
}

export function pipelineRunProjectName(
  projects: Pick<ProjectResponse, 'id' | 'name'>[],
  projectId: string,
) {
  return projects.find(project => project.id === projectId)?.name ?? projectId
}

function rangeDuration(range: PipelineRunDateRange) {
  const day = 24 * 60 * 60 * 1000
  if (range === 'last-24-hours') return day
  if (range === 'last-week') return 7 * day
  if (range === 'last-month') return 30 * day
  if (range === 'last-quarter') return 90 * day
  return undefined
}
