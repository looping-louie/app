import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePipelineRunSnapshots } from '~/composables/usePipelineRunSnapshots'
import type { PipelineRunResponse } from '~/types/api'

describe('pipeline run detail snapshots', () => {
  const listRunEvents = vi.fn()

  beforeEach(() => {
    listRunEvents.mockReset()
    vi.stubGlobal('useApiClient', () => ({ pipelines: { listRunEvents } }))
  })

  it('loads the event ledger for the one run opened in detail', async () => {
    listRunEvents.mockResolvedValue({
      items: [{ id: 'event-1', event_type: 'pipeline_run_created' }],
      total: 1,
    })
    const { load } = usePipelineRunSnapshots()

    const snapshot = await load(pipelineRun('run-1'), 'project-1')

    expect(listRunEvents).toHaveBeenCalledTimes(1)
    expect(listRunEvents).toHaveBeenCalledWith('pipeline-1', 'run-1', 'project-1', { offset: 0 })
    expect(snapshot.events).toHaveLength(1)
  })
})

function pipelineRun(id: string): PipelineRunResponse {
  return {
    id,
    pipeline_id: 'pipeline-1',
    input: 'Ship the requested change',
    commit_mode: 'allow',
    status: 'completed',
    current_activity_run: null,
    steps: [],
    created_at: '2026-09-17T09:00:00Z',
    created_by: 'user-1',
    updated_at: '2026-09-17T09:01:00Z',
  }
}
