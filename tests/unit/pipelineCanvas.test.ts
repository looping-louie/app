import { describe, expect, it } from 'vitest'

import type { PipelineResponse } from '~/types/api'
import { pipelineCanvasActivities } from '~/utils/pipelineCanvas'

describe('pipeline canvas activities', () => {
  it('maps loops and human gates into the shared readonly presentation', () => {
    const pipeline = {
      id: 'pipeline-1',
      name: 'Release review',
      description: 'Review and approve a release.',
      enabled: true,
      model_id: 'pipeline-model',
      harness: null,
      created_at: '2026-09-17T09:00:00Z',
      updated_at: '2026-09-17T09:00:00Z',
      steps: [
        {
          id: 'loop-1',
          status: 'active',
          name: 'Generate proposal',
          description: '',
          type: 'direct_loop',
          model_id: null,
          harness: null,
          config: {
            agents: [{ persona_id: 'writer', role: 'generator' }],
            stop_conditions: { max_iterations: 2, max_tokens: null, timeout_seconds: null },
            output_contract: { type: 'text', description: '', files: [], schema: null },
          },
          dependsOn: [],
          created_at: '2026-09-17T09:00:00Z',
          created_by: 'user-1',
          updated_at: '2026-09-17T09:00:00Z',
          updated_by: 'user-1',
        },
        {
          id: 'gate-1',
          status: 'active',
          name: 'Approve release',
          description: '',
          type: 'approval',
          model_id: null,
          harness: null,
          config: {},
          dependsOn: [],
          created_at: '2026-09-17T09:00:00Z',
          created_by: 'user-1',
          updated_at: '2026-09-17T09:00:00Z',
          updated_by: 'user-1',
        },
      ],
    } as PipelineResponse

    expect(pipelineCanvasActivities(pipeline)).toMatchObject([
      { type: 'loop', loop: { title: 'Generate proposal', flow: 'direct', model_id: 'pipeline-model' } },
      { type: 'human-gate', gate: 'human-review', title: 'Approve release' },
    ])
  })
})
