import { describe, expect, it, vi } from 'vitest'

import type { PipelineRunResponse, PipelineRunStatus } from '~/types/api'
import {
  collectProjectPipelineRuns,
  collectProjectPipelineRunsSettled,
  DEFAULT_PIPELINE_RUN_DATE_RANGE,
  filterPipelineRunSnapshots,
  findPipelineRunSummary,
  loadPipelineRunCatalog,
  mergePipelineRunSummaries,
  pipelineRunCreatedFrom,
  pipelineRunProjectName,
  runCatalogProjectIds,
  sortPipelineRunCatalogRows,
} from '~/utils/pipelineRunCatalog'

const statuses: PipelineRunStatus[] = [
  'prepared',
  'queued',
  'claimed',
  'in_progress',
  'waiting',
  'failed',
  'completed',
]

describe('pipeline run catalog', () => {
  it('loads every Project after a cold load unless the URL explicitly scopes the catalog', async () => {
    const projects = [{ id: 'default-project' }, { id: 'run-project' }]
    const fetchPage = vi.fn(async (projectId: string, offset: number) => ({
      items: offset === 0 && projectId === 'run-project' ? [pipelineRun('new-run', 'queued')] : [],
      total: projectId === 'run-project' ? 1 : 0,
    }))

    const coldLoad = await collectProjectPipelineRuns(
      runCatalogProjectIds(projects, ''),
      fetchPage,
    )
    const scopedLoad = await collectProjectPipelineRuns(
      runCatalogProjectIds(projects, 'default-project'),
      fetchPage,
    )

    expect(coldLoad.map(({ projectId, run }) => [projectId, run.id])).toEqual([
      ['run-project', 'new-run'],
    ])
    expect(scopedLoad).toEqual([])
    expect(fetchPage).toHaveBeenCalledWith('default-project', 0)
    expect(fetchPage).toHaveBeenCalledWith('run-project', 0)
  })

  it('collects all pages so recent runs are not limited to the first API page', async () => {
    const runs = Array.from({ length: 11 }, (_, index) => pipelineRun(`run-${index}`, 'completed'))
    const fetchPage = vi.fn(async (_projectId: string, offset: number) => ({
      items: runs.slice(offset, offset + 10),
      total: runs.length,
    }))

    const result = await collectProjectPipelineRuns(['project-1'], fetchPage)

    expect(result).toHaveLength(11)
    expect(fetchPage.mock.calls.map(([, offset]) => offset)).toEqual([0, 10])
  })

  it('keeps successful projects and reports incomplete coverage when one project fails', async () => {
    const result = await collectProjectPipelineRunsSettled(
      ['project-1', 'project-2'],
      vi.fn(async (projectId: string) => {
        if (projectId === 'project-2') throw new Error('Project unavailable')
        return { items: [pipelineRun('run-1', 'completed')], total: 1 }
      }),
    )

    expect(result.projectRuns.map(({ projectId, run }) => [projectId, run.id])).toEqual([
      ['project-1', 'run-1'],
    ])
    expect(result.failedProjectIds).toEqual(['project-2'])
  })

  it('rejects a catalog load when every project fails', async () => {
    await expect(loadPipelineRunCatalog(
      ['project-1', 'project-2'],
      async () => ({ items: [], total: 0 }),
      async () => { throw new Error('Unavailable') },
    )).rejects.toMatchObject({ failedProjectIds: ['project-1', 'project-2'] })
  })

  it('keeps every run state visible when the status filter is All', () => {
    const snapshots = statuses.map((status, index) => ({
      projectId: 'project-1',
      run: pipelineRun(`run-${index}`, status),
      events: [],
    }))

    expect(filterPipelineRunSnapshots(snapshots, 'all', Date.parse('2026-09-17T08:00:00Z')))
      .toHaveLength(statuses.length)
    for (const status of statuses) {
      expect(filterPipelineRunSnapshots(snapshots, status, Date.parse('2026-09-17T08:00:00Z'))
        .map(snapshot => snapshot.run.status)).toEqual([status])
    }
  })

  it('filters terminal runs by their derived outcome rather than scheduler status alone', () => {
    const succeeded = pipelineRun('succeeded', 'completed')
    const failedStep = pipelineRun('failed-step', 'completed')
    failedStep.steps = [{ activity_id: 'activity-1', activity_run_id: 'activity-run-1', status: 'failed' }]
    const failedRun = pipelineRun('failed-run', 'failed')
    const snapshots = [succeeded, failedStep, failedRun].map(run => ({ projectId: 'project-1', run }))

    expect(filterPipelineRunSnapshots(snapshots, 'completed').map(({ run }) => run.id)).toEqual(['succeeded'])
    expect(filterPipelineRunSnapshots(snapshots, 'failed').map(({ run }) => run.id)).toEqual(['failed-step', 'failed-run'])
  })

  it('keeps old runs visible with the default All time range', () => {
    const oldSnapshot = {
      projectId: 'project-1',
      run: { ...pipelineRun('old-run', 'completed'), created_at: '2024-01-01T09:00:00Z' },
      events: [],
    }

    const createdFrom = pipelineRunCreatedFrom(
      DEFAULT_PIPELINE_RUN_DATE_RANGE,
      Date.parse('2026-09-17T09:00:00Z'),
    )

    expect(createdFrom).toBeUndefined()
    expect(filterPipelineRunSnapshots(
      [oldSnapshot],
      'all',
      createdFrom ? Date.parse(createdFrom) : undefined,
    )).toHaveLength(1)
  })

  it('retains the Project name for runs aggregated from different Projects', () => {
    const projects = [
      { id: 'project-1', name: 'Grader' },
      { id: 'project-2', name: 'Runtime' },
    ]

    expect([
      pipelineRunProjectName(projects, 'project-1'),
      pipelineRunProjectName(projects, 'project-2'),
    ]).toEqual(['Grader', 'Runtime'])
  })

  it('loads and refreshes a lightweight catalog without requesting run events', async () => {
    const runs = Array.from({ length: 25 }, (_, index) => pipelineRun(`run-${index}`, 'completed'))
    const fetchEvents = vi.fn()
    const fetchPipelines = vi.fn(async () => ({ items: [], total: 0 }))
    const fetchRuns = vi.fn(async (_projectId: string, offset: number) => ({
      items: runs.slice(offset, offset + 10),
      total: runs.length,
    }))

    const firstLoad = await loadPipelineRunCatalog(['project-1'], fetchPipelines, fetchRuns)
    const refresh = await loadPipelineRunCatalog(['project-1'], fetchPipelines, fetchRuns)

    expect(firstLoad.summaries).toHaveLength(25)
    expect(refresh.summaries).toHaveLength(25)
    expect(firstLoad.summaries.every(summary => !('events' in summary))).toBe(true)
    expect(fetchEvents).not.toHaveBeenCalled()
  })

  it('updates polled run summaries without loading or attaching events', () => {
    const summary = { projectId: 'project-1', run: pipelineRun('run-1', 'queued') }
    const updated = mergePipelineRunSummaries(
      [summary],
      [{ ...summary.run, status: 'in_progress', updated_at: '2026-09-17T09:02:00Z' }],
    )

    expect(updated[0]?.run.status).toBe('in_progress')
    expect(updated[0]).not.toHaveProperty('events')
  })

  it('opens a preview from its lightweight summary without requesting events', () => {
    const fetchEvents = vi.fn()
    const summary = { projectId: 'project-1', run: pipelineRun('run-1', 'queued') }

    const preview = findPipelineRunSummary(
      [summary],
      'run-1',
      'project-1',
      'pipeline-1',
    )

    expect(preview).toBe(summary)
    expect(preview).not.toHaveProperty('events')
    expect(fetchEvents).not.toHaveBeenCalled()
  })

  it('preserves the existing catalog sort modes', () => {
    const rows = [
      { name: 'Bravo', createdValue: '2026-09-17T10:00:00Z' },
      { name: 'Alpha', createdValue: '2026-09-17T08:00:00Z' },
    ]

    expect(sortPipelineRunCatalogRows([...rows], 'newest').map(row => row.name)).toEqual(['Bravo', 'Alpha'])
    expect(sortPipelineRunCatalogRows([...rows], 'oldest').map(row => row.name)).toEqual(['Alpha', 'Bravo'])
    expect(sortPipelineRunCatalogRows([...rows], 'alphabetical').map(row => row.name)).toEqual(['Alpha', 'Bravo'])
    expect(sortPipelineRunCatalogRows([...rows], 'alphabetical-desc').map(row => row.name)).toEqual(['Bravo', 'Alpha'])
  })
})

function pipelineRun(id: string, status: PipelineRunStatus): PipelineRunResponse {
  return {
    id,
    pipeline_id: 'pipeline-1',
    input: 'Ship the requested change',
    commit_mode: 'allow',
    status,
    current_activity_run: null,
    steps: [],
    created_at: '2026-09-17T09:00:00Z',
    created_by: 'user-1',
    updated_at: '2026-09-17T09:01:00Z',
  }
}
