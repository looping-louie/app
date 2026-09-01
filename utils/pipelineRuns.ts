import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { parseHarnessTurnEvent } from '~/utils/harnessObservations'

export interface PipelineRunSnapshot {
  run: PipelineRunResponse
  events: PipelineRunEventResponse[]
}

export function runPrompt(run: PipelineRunResponse) {
  return run.input.trim() || run.id
}

export function runTokenCount(events: PipelineRunEventResponse[]) {
  return events.reduce((total, event) => total + eventTokenCount(event), 0)
}

export function eventTokenCount(event: PipelineRunEventResponse) {
  const usage = parseHarnessTurnEvent(event)?.observation.usage
  const total = numberValue(usage?.total_tokens)
  if (total !== undefined) return total
  return (numberValue(usage?.input_tokens) ?? 0) + (numberValue(usage?.output_tokens) ?? 0)
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
