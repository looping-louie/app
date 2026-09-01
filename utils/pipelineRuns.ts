import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { parseHarnessTurnEvent, type ParsedHarnessTurnEvent } from '~/utils/harnessObservations'

export interface PipelineRunSnapshot {
  run: PipelineRunResponse
  events: PipelineRunEventResponse[]
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

export function runPrompt(run: PipelineRunResponse) {
  return run.input.trim() || run.id
}

export function runTokenCount(events: PipelineRunEventResponse[]) {
  return events.reduce((total, event) => total + eventTokenCount(event), 0)
}

export function harnessTurns(events: PipelineRunEventResponse[]): HarnessTurnRecord[] {
  return events.flatMap((event) => {
    const turn = parseHarnessTurnEvent(event)
    return turn ? [{ ...turn, event }] : []
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

export function eventTokenCount(event: PipelineRunEventResponse) {
  const turn = parseHarnessTurnEvent(event)
  return turn ? turnUsage(turn).total : 0
}

export function eventLatency(event: PipelineRunEventResponse) {
  return numberValue(parseHarnessTurnEvent(event)?.observation.duration_ms) ?? 0
}

export function eventErrorMessages(event: PipelineRunEventResponse) {
  const observation = parseHarnessTurnEvent(event)?.observation
  if (!observation) return []
  return [...new Set([observation.error, ...observation.diagnostics]
    .filter((message): message is string => typeof message === 'string' && Boolean(message.trim())))]
}

export function eventLabel(type: string) {
  return type.replaceAll('_', ' ').replace(/^./, value => value.toUpperCase())
}

export function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}
