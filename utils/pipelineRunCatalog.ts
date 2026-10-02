import type { ApiListResponse, PipelineResponse, PipelineRunResponse, PipelineRunStatus, ProjectResponse } from '~/types/api'
import { collectApiPages } from '~/utils/apiPagination'
import { pipelineRunDisplayStatus, type PipelineRunSummary } from '~/utils/pipelineRuns'

export interface ProjectPipelineRun {
  projectId: string
  run: PipelineRunResponse
}

export interface ProjectPipelineRunCollection {
  projectRuns: ProjectPipelineRun[]
  failedProjectIds: string[]
}

export class PipelineRunCatalogLoadError extends Error {
  constructor(public readonly failedProjectIds: string[]) {
    super(`Runs could not be loaded for ${failedProjectIds.length} project${failedProjectIds.length === 1 ? '' : 's'}.`)
    this.name = 'PipelineRunCatalogLoadError'
  }
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
  return projectRuns.flatMap(({ projectId, runs }) => runs.map(run => ({ projectId, run })))
}

export async function collectProjectPipelineRunsSettled(
  projectIds: string[],
  fetchPage: (projectId: string, offset: number) => Promise<ApiListResponse<PipelineRunResponse>>,
): Promise<ProjectPipelineRunCollection> {
  const results = await Promise.allSettled(projectIds.map(async projectId => ({
    projectId,
    runs: await collectApiPages(offset => fetchPage(projectId, offset)),
  })))
  const failedProjectIds = results.flatMap((result, index) => (
    result.status === 'rejected' ? [projectIds[index]!] : []
  ))
  const projectRuns = results.flatMap(result => (
    result.status === 'fulfilled'
      ? result.value.runs.map(run => ({ projectId: result.value.projectId, run }))
      : []
  ))
  return { projectRuns, failedProjectIds }
}

export async function loadPipelineRunCatalog(
  projectIds: string[],
  fetchPipelinePage: (offset: number) => Promise<ApiListResponse<PipelineResponse>>,
  fetchRunPage: (projectId: string, offset: number) => Promise<ApiListResponse<PipelineRunResponse>>,
) {
  const [pipelines, collection] = await Promise.all([
    collectApiPages(fetchPipelinePage),
    collectProjectPipelineRunsSettled(projectIds, fetchRunPage),
  ])
  if (projectIds.length && collection.failedProjectIds.length === projectIds.length) {
    throw new PipelineRunCatalogLoadError(collection.failedProjectIds)
  }
  return {
    summaries: collection.projectRuns.map(({ projectId, run }): PipelineRunSummary => ({ projectId, run })),
    pipelineNames: new Map(pipelines.map(pipeline => [pipeline.id, pipeline.name])),
    failedProjectIds: collection.failedProjectIds,
  }
}

export function filterPipelineRunSnapshots(
  snapshots: PipelineRunSummary[],
  status: PipelineRunStatus | 'all',
  createdFrom?: number,
) {
  return snapshots.filter(({ run }) => (
    (status === 'all'
      || (status === 'failed' && pipelineRunDisplayStatus(run).outcome === 'failed')
      || (status === 'completed' && pipelineRunDisplayStatus(run).outcome === 'succeeded')
      || (!['failed', 'completed'].includes(status) && run.status === status))
    && (createdFrom === undefined || Date.parse(run.created_at) >= createdFrom)
  ))
}

export function sortPipelineRunCatalogRows<T extends { name: string, createdValue: string }>(
  rows: T[],
  sort: string,
) {
  return rows.sort((first, second) => {
    if (sort === 'alphabetical-desc') return second.name.localeCompare(first.name)
    if (sort === 'oldest') return Date.parse(first.createdValue) - Date.parse(second.createdValue)
    if (sort === 'newest') return Date.parse(second.createdValue) - Date.parse(first.createdValue)
    return first.name.localeCompare(second.name)
  })
}

export function mergePipelineRunSummaries(
  summaries: PipelineRunSummary[],
  updates: PipelineRunResponse[],
) {
  const updatesById = new Map(updates.map(run => [run.id, run]))
  return summaries.map(summary => ({
    ...summary,
    run: updatesById.get(summary.run.id) ?? summary.run,
  }))
}

export function findPipelineRunSummary(
  summaries: PipelineRunSummary[],
  runId: string,
  projectId: string,
  pipelineId: string,
) {
  return summaries.find(summary => (
    summary.run.id === runId
    && summary.projectId === projectId
    && summary.run.pipeline_id === pipelineId
  )) ?? null
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
