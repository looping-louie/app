import { describe, expect, it } from 'vitest'

import type { PipelineRunResponse, PipelineRunStatus } from '~/types/api'
import { humanGateNotifications } from '~/utils/humanGateNotifications'

describe('human-gate notifications', () => {
  it('links a waiting run directly to its Project-scoped gate', () => {
    const notifications = humanGateNotifications(
      [{ id: 'project-1', name: 'Grader' }],
      [{ projectId: 'project-1', run: pipelineRun('waiting') }],
    )

    expect(notifications).toEqual([expect.objectContaining({
      projectName: 'Grader',
      runId: 'run-1',
      runLabel: 'Review the Grader implementation',
      to: '/runs/run-1?project=project-1&pipeline=pipeline-1#human-gate',
    })])
  })

  it('removes the notification when the resolved run is no longer waiting', () => {
    const projects = [{ id: 'project-1', name: 'Grader' }]
    const pending = [{ projectId: 'project-1', run: pipelineRun('waiting') }]
    const resolved = [{ projectId: 'project-1', run: pipelineRun('completed') }]

    expect(humanGateNotifications(projects, pending)).toHaveLength(1)
    expect(humanGateNotifications(projects, resolved)).toEqual([])
  })

  it.each<PipelineRunStatus>(['prepared', 'queued', 'claimed', 'in_progress', 'failed', 'completed'])(
    'does not notify for an ordinary %s run',
    (status) => {
      expect(humanGateNotifications(
        [{ id: 'project-1', name: 'Grader' }],
        [{ projectId: 'project-1', run: pipelineRun(status) }],
      )).toEqual([])
    },
  )
})

function pipelineRun(status: PipelineRunStatus): PipelineRunResponse {
  return {
    id: 'run-1',
    pipeline_id: 'pipeline-1',
    input: 'Review the Grader implementation',
    commit_mode: 'allow',
    status,
    current_activity_run: null,
    steps: [],
    created_at: '2026-09-17T10:00:00Z',
    created_by: 'user-1',
    updated_at: '2026-09-17T10:01:00Z',
  }
}
