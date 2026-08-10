export interface LoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

export function useLoopStopConditions() {
  function formatLoopStopConditions(conditions?: LoopStopConditions | null): string {
    if (!conditions) return ''

    return [
      conditions.max_iterations != null ? `${conditions.max_iterations} loops` : null,
      conditions.max_tokens != null ? `${conditions.max_tokens.toLocaleString('en-US')} tokens` : null,
      conditions.timeout_seconds != null ? `${conditions.timeout_seconds} seconds` : null,
    ].filter((condition): condition is string => Boolean(condition)).join(', ')
  }

  return { formatLoopStopConditions }
}
