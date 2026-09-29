import { describe, expect, it } from 'vitest'

import { pipelineRunDetailRoute } from '~/utils/pipelineRunRoutes'

describe('pipeline run routes', () => {
  it('builds the full-detail route with API lookup context', () => {
    expect(pipelineRunDetailRoute({
      projectId: 'project-1',
      pipelineId: 'pipeline-1',
      runId: 'run-1',
    })).toBe('/runs/run-1?project=project-1&pipeline=pipeline-1')
  })

  it('encodes run identifiers and retains an optional anchor', () => {
    expect(pipelineRunDetailRoute({
      projectId: 'project & 1',
      pipelineId: 'pipeline/1',
      runId: 'run/1',
    }, 'human-gate')).toBe('/runs/run%2F1?project=project+%26+1&pipeline=pipeline%2F1#human-gate')
  })
})
