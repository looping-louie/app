import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'

export const activeRunStatuses = new Set(['pending', 'claimed', 'running'])

export function runPrompt(run: PipelineRunResponse) {
  const prompt = run.input.prompt
  return typeof prompt === 'string' && prompt.trim() ? prompt.trim() : run.id
}

export function runTokenCount(run: PipelineRunResponse) {
  return run.events.reduce((total, event) => total + eventTokenCount(event), 0)
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

export function runDuration(run: PipelineRunResponse) {
  const start = Date.parse(run.started_at ?? run.created_at)
  const finish = Date.parse(run.finished_at ?? run.updated_at)
  return Number.isFinite(start) && Number.isFinite(finish) ? Math.max(0, finish - start) : 0
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
