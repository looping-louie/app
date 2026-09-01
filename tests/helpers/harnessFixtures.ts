import type { HarnessTurnObservation, PipelineRunEventResponse } from '~/types/api'
import completedObservationFixture from '../fixtures/harness_observations/codex_cli_v1_completed.json'
import failedObservationFixture from '../fixtures/harness_observations/codex_cli_v1_failed.json'

export const completedObservation = completedObservationFixture as unknown as HarnessTurnObservation
export const failedObservation = failedObservationFixture as unknown as HarnessTurnObservation

export function harnessEvent(
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
