import type { HarnessTurnIdentity, PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { isSchedulerEvent, parseHarnessTurnEvent, type ParsedHarnessTurnEvent } from '~/utils/harnessObservations'

export interface PipelineRunSnapshot {
  run: PipelineRunResponse
  events: PipelineRunEventResponse[]
  projectId: string
}

export interface PipelineRunSummary {
  run: PipelineRunResponse
  projectId: string
}

export interface HarnessTurnRecord extends ParsedHarnessTurnEvent {
  event: PipelineRunEventResponse
}

export interface HarnessTurnUsageSummary {
  input: number
  output: number
  cached: number
  total: number
}

export interface PipelineRunPreviewMetrics {
  startedAt: string | null
  endedAt: string | null
  durationMs: number | null
  inputTokens: number | null
  outputTokens: number | null
  cacheTokens: number | null
  harnesses: HarnessTurnIdentity[]
}

export interface CompactRunTimelineEntry {
  activityId: string
  activityRunId: string | null
  timestamp: string | null
}

export type PipelineRunOutcome = 'prepared' | 'running' | 'action-required' | 'failed' | 'succeeded'
export type PipelineRunStatusTone = 'positive' | 'negative' | 'quiet' | 'subtle' | 'neutral' | 'strong' | 'emphasis'

export interface PipelineRunDisplayStatus {
  label: 'Prepared' | 'Queued' | 'Claimed' | 'Running' | 'Action required' | 'Failed' | 'Succeeded'
  outcome: PipelineRunOutcome
  tone: PipelineRunStatusTone
}

export function runPrompt(run: PipelineRunResponse) {
  return run.input.trim() || run.id
}

export function pipelineRunDisplayStatus(run: PipelineRunResponse): PipelineRunDisplayStatus {
  if (run.status === 'waiting') return { label: 'Action required', outcome: 'action-required', tone: 'emphasis' }
  if (run.status === 'prepared') return { label: 'Prepared', outcome: 'prepared', tone: 'quiet' }
  if (run.status === 'queued') return { label: 'Queued', outcome: 'running', tone: 'subtle' }
  if (run.status === 'claimed') return { label: 'Claimed', outcome: 'running', tone: 'neutral' }
  if (run.status === 'in_progress') return { label: 'Running', outcome: 'running', tone: 'strong' }
  if (run.status === 'failed' || run.steps.some(step => step.status === 'failed')) {
    return { label: 'Failed', outcome: 'failed', tone: 'negative' }
  }
  return { label: 'Succeeded', outcome: 'succeeded', tone: 'positive' }
}

export function runTokenCount(events: PipelineRunEventResponse[]) {
  return harnessTurns(events).reduce((total, turn) => total + turnUsage(turn).total, 0)
}

export function pipelineRunPreviewMetrics(
  run: PipelineRunResponse,
  events: PipelineRunEventResponse[],
): PipelineRunPreviewMetrics {
  const schedulerEvents = events.filter(isSchedulerEvent)
  const startedAt = earliestTimestamp(schedulerEvents.flatMap((event) => {
    if (event.event_type === 'pipeline_step_started') return [event.created_at]
    if (event.event_type === 'pipeline_step_completed' || event.event_type === 'pipeline_step_failed') {
      return [event.payload.started_at]
    }
    return []
  }))
  const endedAt = ['completed', 'failed'].includes(run.status)
    ? latestTimestamp(schedulerEvents.flatMap((event) => (
        event.event_type === 'pipeline_step_completed' || event.event_type === 'pipeline_step_failed'
          ? [event.payload.completed_at]
          : []
      )))
    : null
  const turns = harnessTurns(events)
  const schedulerHarnesses = schedulerEvents.flatMap(event => (
    event.event_type === 'pipeline_step_started' && event.payload.harness
      ? [event.payload.harness]
      : []
  ))

  return {
    startedAt,
    endedAt,
    durationMs: startedAt && endedAt
      ? Math.max(0, Date.parse(endedAt) - Date.parse(startedAt))
      : null,
    inputTokens: sumReportedUsage(turns, ['input_tokens']),
    outputTokens: sumReportedUsage(turns, ['output_tokens']),
    cacheTokens: sumReportedUsage(turns, ['cached_input_tokens', 'cached_tokens']),
    harnesses: uniqueHarnesses([
      ...schedulerHarnesses,
      ...turns.map(turn => turn.observation.harness),
    ]),
  }
}

export function compactRunTimeline(
  run: PipelineRunResponse,
  events: PipelineRunEventResponse[],
): CompactRunTimelineEntry[] {
  const schedulerEvents = events.filter(isSchedulerEvent)
  return run.steps.map((step) => {
    const matching = schedulerEvents.filter((event) => {
      if (event.activity_id !== step.activity_id) return false
      if (
        event.event_type !== 'pipeline_step_started'
        && event.event_type !== 'pipeline_step_completed'
        && event.event_type !== 'pipeline_step_failed'
      ) return false
      return !step.activity_run_id || event.payload.activity_run_id === step.activity_run_id
    })
    const started = matching.find(event => event.event_type === 'pipeline_step_started')
    const terminal = matching.find(event => (
      event.event_type === 'pipeline_step_completed' || event.event_type === 'pipeline_step_failed'
    ))
    return {
      activityId: step.activity_id,
      activityRunId: step.activity_run_id,
      timestamp: started?.created_at
        ?? (terminal && (terminal.event_type === 'pipeline_step_completed' || terminal.event_type === 'pipeline_step_failed')
          ? terminal.payload.started_at
          : null),
    }
  })
}

export function harnessTurns(events: PipelineRunEventResponse[]): HarnessTurnRecord[] {
  return events.flatMap((event) => {
    const turn = parseHarnessTurnEvent(event)
    return turn ? [{ ...turn, event }] : []
  })
}

export function needsTerminalEventRefresh(snapshot: PipelineRunSnapshot) {
  if (!['completed', 'failed'].includes(snapshot.run.status)) return false
  return snapshot.run.steps.some((step) => {
    if (!step.activity_run_id || !['completed', 'failed'].includes(step.status)) return false
    return !snapshot.events.some((event) => {
      if (!isSchedulerEvent(event)) return false
      if (step.status === 'completed' && event.event_type === 'pipeline_step_completed') {
        return event.payload.activity_run_id === step.activity_run_id
      }
      if (step.status === 'failed' && event.event_type === 'pipeline_step_failed') {
        return event.payload.activity_run_id === step.activity_run_id
      }
      return false
    })
  })
}

export function turnUsage(turn: ParsedHarnessTurnEvent): HarnessTurnUsageSummary {
  const usage = turn.observation.usage
  const input = numberValue(usage.input_tokens) ?? 0
  const output = numberValue(usage.output_tokens) ?? 0
  const cached = numberValue(usage.cached_input_tokens) ?? numberValue(usage.cached_tokens) ?? 0
  const total = numberValue(usage.total_tokens) ?? input + output
  return { input, output, cached, total }
}

export function turnErrorMessages(turn: ParsedHarnessTurnEvent) {
  return [...new Set([turn.observation.error, ...turn.observation.diagnostics]
    .filter((message): message is string => typeof message === 'string' && Boolean(message.trim())))]
}

export function eventLabel(type: string) {
  return type.replaceAll('_', ' ').replace(/^./, value => value.toUpperCase())
}

export function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

function sumReportedUsage(turns: HarnessTurnRecord[], keys: string[]): number | null {
  if (!turns.length) return null
  const values = turns.map((turn) => {
    for (const key of keys) {
      const value = numberValue(turn.observation.usage[key])
      if (value !== undefined) return value
    }
    return null
  })
  return values.some(value => value === null)
    ? null
    : values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function uniqueHarnesses(harnesses: HarnessTurnIdentity[]) {
  return [...new Map(harnesses.map(harness => [`${harness.kind}:${harness.version}`, harness])).values()]
}

function earliestTimestamp(values: string[]) {
  return sortedValidTimestamps(values).at(0) ?? null
}

function latestTimestamp(values: string[]) {
  return sortedValidTimestamps(values).at(-1) ?? null
}

function sortedValidTimestamps(values: string[]) {
  return values
    .filter(value => Number.isFinite(Date.parse(value)))
    .sort((left, right) => Date.parse(left) - Date.parse(right))
}
