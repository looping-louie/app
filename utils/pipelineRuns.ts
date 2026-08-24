import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'

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
  const usage = recordValue(event.payload.usage)
  const total = numberValue(usage?.total_tokens)
  if (total !== undefined) return total
  return (numberValue(usage?.input_tokens) ?? 0) + (numberValue(usage?.output_tokens) ?? 0)
}

export function eventLatency(event: PipelineRunEventResponse) {
  return numberValue(event.payload.latency_ms) ?? 0
}

export function eventLabel(type: string) {
  return type.replaceAll('_', ' ').replace(/^./, value => value.toUpperCase())
}

export function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

export function recordValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
