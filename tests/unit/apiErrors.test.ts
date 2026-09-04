import { describe, expect, it } from 'vitest'

import { apiErrorDetails, apiErrorMessage, apiErrorSummary } from '~/utils/api/errors'

describe('Pipeline run API errors', () => {
  it('preserves the actionable Codex missing-model contract', () => {
    const cause = {
      data: {
        error: {
          code: 'pipeline_run_unavailable',
          message: 'codex_cli execution requires a model_id',
          details: {
            reason: 'model_missing',
            pipeline_id: 'pipeline-1',
            activity_id: 'activity-1',
          },
        },
      },
    }

    expect(apiErrorMessage(cause)).toBe('codex_cli execution requires a model_id')
    expect(apiErrorDetails(cause)).toEqual({
      reason: 'model_missing',
      pipeline_id: 'pipeline-1',
      activity_id: 'activity-1',
    })
  })

  it('summarizes the HTTP status and API error code for refresh failures', () => {
    const cause = {
      statusCode: 500,
      data: {
        error: {
          code: 'activity_checkpoint_failed',
          message: 'The activity checkpoint could not be persisted.',
          details: null,
        },
      },
    }

    expect(apiErrorSummary(cause)).toBe(
      'HTTP 500 · activity_checkpoint_failed — The activity checkpoint could not be persisted.',
    )
  })
})
