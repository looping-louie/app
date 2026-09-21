import { describe, expect, it, vi } from 'vitest'

import type { PipelineRunResponse, PipelineRunStatus } from '~/types/api'
import {
  collectProjectPipelineRuns,
  DEFAULT_PIPELINE_RUN_DATE_RANGE,
  filterPipelineRunSnapshots,
  pipelineRunCreatedFrom,
  pipelineRunProjectName,
  runCatalogProjectIds,
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
