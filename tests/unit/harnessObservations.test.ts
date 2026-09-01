import { describe, expect, it } from 'vitest'

import type { HarnessTurnObservation, PipelineRunEventResponse } from '~/types/api'
import {
  harnessCommitSummary,
  parseHarnessTurnEvent,
} from '~/utils/harnessObservations'
import completedObservationFixture from '../fixtures/harness_observations/codex_cli_v1_completed.json'
import failedObservationFixture from '../fixtures/harness_observations/codex_cli_v1_failed.json'

const completedObservation = completedObservationFixture as unknown as HarnessTurnObservation
const failedObservation = failedObservationFixture as unknown as HarnessTurnObservation

describe('Harness observation contracts', () => {
  it('parses generic and compatibility completed events', () => {
    for (const eventType of ['harness_turn_completed', 'codex_turn_completed']) {
      const parsed = parseHarnessTurnEvent(event(eventType, completedObservation))

      expect(parsed?.outcome).toBe('completed')
      expect(parsed?.activityRunId).toBe('activity-run-1')
      expect(parsed?.observation.duration_ms).toBe(250)
      expect(parsed?.observation.requested_model).toBe('gpt-5-codex')
      expect(parsed?.observation.actual_model).toBe('gpt-5.1-codex')
    }
  })

  it('retains partial observations from generic and compatibility failures', () => {
    for (const eventType of ['harness_turn_failed', 'codex_turn_failed']) {
      const parsed = parseHarnessTurnEvent(event(eventType, failedObservation))

      expect(parsed?.outcome).toBe('failed')
      expect(parsed?.observation.error).toBe('boom')
      expect(parsed?.observation.diagnostics).toEqual([
        'Codex emitted a partial response.',
        'boom',
      ])
      expect(parsed?.observation.changed_files).toEqual(['partial.py'])
    }
  })

  it('rejects an event whose outcome contradicts its observation', () => {
    expect(parseHarnessTurnEvent(
      event('harness_turn_completed', failedObservation),
    )).toBeNull()
  })

  it('separates commit policy, authorization, and Git outcome', () => {
    const committed = harnessCommitSummary({
      ...completedObservation,
      committed: true,
      final_commit_sha: 'final-sha',
    }, 'allow')
    const forbidden = harnessCommitSummary(completedObservation, 'forbid')
    const failed = harnessCommitSummary({
      ...completedObservation,
      committed: false,
      commit_error: 'Git rejected the commit.',
    }, 'allow')

    expect(committed).toMatchObject({
      authorization: 'authorized',
      outcome: 'committed',
      proposedMessage: 'feat: complete requested change',
      resultingCommitSha: 'final-sha',
    })
    expect(forbidden).toMatchObject({
      authorization: 'forbidden',
      outcome: 'not_attempted',
      resultingCommitSha: null,
    })
    expect(failed).toMatchObject({
      authorization: 'authorized',
      outcome: 'failed',
      resultingCommitSha: null,
    })
  })
})

function event(
  eventType: string,
  observation: HarnessTurnObservation,
): PipelineRunEventResponse {
  return {
    id: `event-${eventType}`,
    event_type: eventType,
    activity_id: 'activity-1',
    actor_id: 'worker-1',
    payload: { ...observation, activity_run_id: 'activity-run-1' },
    created_at: '2026-08-31T10:00:02+00:00',
  }
}
