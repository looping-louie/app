import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { isSchedulerEvent, parseHarnessTurnEvent, type ParsedHarnessTurnEvent } from '~/utils/harnessObservations'

export interface PipelineRunSnapshot {
  run: PipelineRunResponse
  events: PipelineRunEventResponse[]
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

export type PipelineRunOutcome = 'prepared' | 'running' | 'action-required' | 'failed' | 'succeeded'

export interface PipelineRunDisplayStatus {
  label: 'Prepared' | 'Running' | 'Action required' | 'Failed' | 'Succeeded'
  outcome: PipelineRunOutcome
}

export function runPrompt(run: PipelineRunResponse) {
  return run.input.trim() || run.id
}

export function pipelineRunDisplayStatus(run: PipelineRunResponse): PipelineRunDisplayStatus {
  if (run.status === 'waiting') return { label: 'Action required', outcome: 'action-required' }
  if (run.status === 'prepared') return { label: 'Prepared', outcome: 'prepared' }
  if (!['completed', 'failed'].includes(run.status)) return { label: 'Running', outcome: 'running' }
  if (run.status === 'failed' || run.steps.some(step => step.status === 'failed')) {
    return { label: 'Failed', outcome: 'failed' }
  }
  return { label: 'Succeeded', outcome: 'succeeded' }
}

export function runTokenCount(events: PipelineRunEventResponse[]) {
  return harnessTurns(events).reduce((total, turn) => total + turnUsage(turn).total, 0)
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
