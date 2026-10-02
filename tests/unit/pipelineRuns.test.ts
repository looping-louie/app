import { describe, expect, it } from 'vitest'

import type {
  PipelineRunEventResponse,
  PipelineRunResponse,
} from '~/types/api'
import { observabilityLogs, observabilityMetrics } from '~/utils/observability'
import {
  eventLabel,
  harnessTurns,
  needsTerminalEventRefresh,
  pipelineRunDisplayStatus,
  turnErrorMessages,
  turnUsage,
} from '~/utils/pipelineRuns'
import { completedObservation, failedObservation, harnessEvent as event } from '../helpers/harnessFixtures'

const completedEvent = event(
  'harness_turn_completed',
  completedObservation,
)
const failedEvent = event(
  'harness_turn_failed',
  failedObservation,
)

describe('Pipeline run transformations', () => {
  it('uses duration_ms and the reported total token count', () => {
    const eventWithExplicitTotal = event('harness_turn_completed', {
      ...completedObservation,
      usage: { ...completedObservation.usage, total_tokens: 99 },
    })
    const [turn] = harnessTurns([eventWithExplicitTotal])
    expect(turn).toBeDefined()
    if (!turn) return

    expect(turn.observation.duration_ms).toBe(250)
    expect(turnUsage(turn)).toEqual({ input: 2, output: 3, cached: 1, total: 99 })
  })

  it('falls back to input plus output tokens and preserves errors', () => {
    const [turn] = harnessTurns([failedEvent])
    expect(turn).toBeDefined()
    if (!turn) return

    expect(turnUsage(turn)).toEqual({ input: 10, output: 3, cached: 4, total: 13 })
    expect(turnErrorMessages(turn)).toEqual([
      'boom',
      'Codex emitted a partial response.',
    ])
  })

  it('derives metrics and logs only from Harness turns', () => {
    const schedulerEvent: PipelineRunEventResponse = {
      id: 'step-failed',
      event_type: 'pipeline_step_failed',
      activity_id: 'activity-1',
      actor_id: 'worker-1',
      payload: {
        activity_run_id: 'activity-run-1',
        status: 'failed',
        started_at: '2026-08-31T10:00:00+00:00',
        completed_at: '2026-08-31T10:00:01+00:00',
      },
      created_at: '2026-08-31T10:00:01+00:00',
    }
    const snapshot = { run: pipelineRun(), events: [completedEvent, failedEvent, schedulerEvent], projectId: 'project-1' }
    const metrics = observabilityMetrics([snapshot])
    const logs = observabilityLogs([snapshot])

    expect(metrics.map(metric => [metric.label, metric.value])).toEqual([
      ['Harness turns', 2],
      ['Successful turns', 1],
      ['Failed turns', 1],
      ['Success rate', '50.0'],
      ['Average duration', '0.63'],
      ['P95 duration', '1.00'],
      ['Total tokens', '18'],
      ['Model divergences', 1],
    ])
    expect(logs).toHaveLength(2)
    expect(logs.every(log => log.phase === 'execute')).toBe(true)
    expect(logs.find(log => log.status === 'completed')?.model).toBe(
      'gpt-5-codex → gpt-5.1-codex',
    )
    expect(logs.find(log => log.status === 'failed')?.error).toContain('boom')
    expect(eventLabel('pipeline_step_failed')).toBe('Pipeline step failed')
  })

  it('recognizes the terminal scheduler event used by the timeline', () => {
    const run = pipelineRun()
    const snapshot = { run, events: [failedEvent], projectId: 'project-1' }

    expect(needsTerminalEventRefresh(snapshot)).toBe(true)
    snapshot.events.push({
      id: 'step-failed',
      event_type: 'pipeline_step_failed',
      activity_id: 'activity-1',
      actor_id: 'worker-1',
      payload: {
        activity_run_id: 'activity-run-1',
        status: 'failed',
        started_at: '2026-08-31T10:00:00+00:00',
        completed_at: '2026-08-31T10:00:01+00:00',
      },
      created_at: '2026-08-31T10:00:01+00:00',
    })
    expect(needsTerminalEventRefresh(snapshot)).toBe(false)
  })

  it('shows a failed outcome when a terminal run contains a failed step', () => {
    const run = pipelineRun()
    run.status = 'completed'

    expect(pipelineRunDisplayStatus(run)).toEqual({ label: 'Failed', outcome: 'failed', tone: 'negative' })
  })

  it('shows a successful outcome when a terminal run has no failed steps', () => {
    const run = pipelineRun()
    run.status = 'completed'
    run.steps[0]!.status = 'completed'

    expect(pipelineRunDisplayStatus(run)).toEqual({ label: 'Succeeded', outcome: 'succeeded', tone: 'positive' })
  })

  it('shows waiting human gates as requiring action', () => {
    const run = pipelineRun()
    run.status = 'waiting'

    expect(pipelineRunDisplayStatus(run)).toEqual({ label: 'Action required', outcome: 'action-required', tone: 'emphasis' })
  })

  it('shows active executions as running', () => {
    const run = pipelineRun()
    run.status = 'in_progress'

    expect(pipelineRunDisplayStatus(run)).toEqual({ label: 'Running', outcome: 'running', tone: 'strong' })
  })

  it.each([
    ['queued', 'Queued', 'subtle'],
    ['claimed', 'Claimed', 'neutral'],
  ] as const)('keeps the %s lifecycle state visible', (status, label, tone) => {
    const run = pipelineRun()
    run.status = status

    expect(pipelineRunDisplayStatus(run)).toEqual({ label, outcome: 'running', tone })
  })

  it('does not describe a prepared run as already running', () => {
    const run = pipelineRun()
    run.status = 'prepared'

    expect(pipelineRunDisplayStatus(run)).toEqual({ label: 'Prepared', outcome: 'prepared', tone: 'quiet' })
  })
})

function pipelineRun(): PipelineRunResponse {
  return {
    id: 'pipeline-run-1',
    pipeline_id: 'pipeline-1',
    input: 'Implement the requested change.',
    commit_mode: 'allow',
    status: 'failed',
    current_activity_run: null,
    steps: [{
      activity_id: 'activity-1',
      status: 'failed',
      activity_run_id: 'activity-run-1',
    }],
    created_at: '2026-08-31T10:00:00+00:00',
    created_by: 'user-1',
    updated_at: '2026-08-31T10:00:01+00:00',
  }
}
