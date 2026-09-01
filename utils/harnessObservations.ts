import type {
  CodexCliTurnObservation,
  HarnessTurnObservation,
  HarnessTurnOutcome,
  PipelineRunCommitMode,
  PipelineRunEventResponse,
  SchedulerEvent,
} from '~/types/api'

export interface ParsedHarnessTurnEvent {
  outcome: HarnessTurnOutcome
  activityRunId: string
  observation: HarnessTurnObservation
}

export type HarnessCommitAuthorization = 'forbidden' | 'authorized' | 'not_reached'
export type HarnessCommitOutcome = 'committed' | 'failed' | 'not_committed' | 'not_attempted'

export interface HarnessCommitSummary {
  policy: PipelineRunCommitMode
  authorization: HarnessCommitAuthorization
  outcome: HarnessCommitOutcome
  proposedMessage: string | null
  resultingCommitSha: string | null
}

export function harnessCommitSummary(
  observation: HarnessTurnObservation,
  policy: PipelineRunCommitMode,
): HarnessCommitSummary {
  const proposedMessage = observation.commit_message?.trim() || null
  if (policy === 'forbid') {
    return {
      policy,
      authorization: 'forbidden',
      outcome: 'not_attempted',
      proposedMessage,
      resultingCommitSha: null,
    }
  }
  const authorized = observation.committed !== undefined || Boolean(observation.commit_error)
  const outcome: HarnessCommitOutcome = observation.commit_error
    ? 'failed'
    : observation.committed === true
      ? 'committed'
      : observation.committed === false
        ? 'not_committed'
        : 'not_attempted'
  return {
    policy,
    authorization: authorized ? 'authorized' : 'not_reached',
    outcome,
    proposedMessage,
    resultingCommitSha: outcome === 'committed' ? observation.final_commit_sha : null,
  }
}

export function isHarnessTurnObservation(value: unknown): value is HarnessTurnObservation {
  return isCodexCliTurnObservation(value)
}

export function parseHarnessTurnObservation(value: unknown): HarnessTurnObservation | null {
  if (isHarnessTurnObservation(value)) return value
  const legacy = recordValue(value)
  if (
    !legacy
    || 'schema_version' in legacy
    || 'harness' in legacy
    || !Array.isArray(legacy.materialized_skills)
  ) return null
  const candidate = {
    ...legacy,
    schema_version: 'v1',
    harness: { kind: 'codex_cli', version: 'v1', config: {} },
  }
  return isCodexCliTurnObservation(candidate) ? candidate : null
}

export function isCodexCliTurnObservation(value: unknown): value is CodexCliTurnObservation {
  const observation = recordValue(value)
  if (!observation || observation.schema_version !== 'v1') return false
  const harness = recordValue(observation.harness)
  return Boolean(
    harness
    && harness.kind === 'codex_cli'
    && harness.version === 'v1'
    && isRecord(harness.config)
    && optionalString(observation.turn_id)
    && optionalTurnPhase(observation.phase)
    && optionalString(observation.agent_id)
    && optionalAgentRole(observation.role)
    && optionalPositiveInteger(observation.iteration)
    && (observation.output === undefined || isRecord(observation.output))
    && typeof observation.completed === 'boolean'
    && nullableString(observation.started_at)
    && nullableString(observation.completed_at)
    && nullableNonNegativeNumber(observation.duration_ms)
    && nonEmptyString(observation.requested_model)
    && nullableString(observation.actual_model)
    && nullableString(observation.reasoning_effort)
    && nullableString(observation.session_reference)
    && isUsage(observation.usage)
    && nullableNumber(observation.exit_code)
    && stringArray(observation.diagnostics)
    && isMaterializedSkills(observation.materialized_skills)
    && nullableString(observation.source_commit_sha)
    && nullableString(observation.final_commit_sha)
    && typeof observation.final_diff === 'string'
    && stringArray(observation.changed_files)
    && typeof observation.final_response === 'string'
    && nullableString(observation.error)
    && optionalString(observation.commit_message)
    && optionalBoolean(observation.committed)
    && optionalString(observation.commit_error),
  )
}

export function parseHarnessTurnEvent(event: PipelineRunEventResponse): ParsedHarnessTurnEvent | null {
  const outcome = harnessTurnOutcome(event.event_type)
  if (!outcome) return null
  const payload = recordValue(event.payload)
  if (!payload || !nonEmptyString(payload.activity_run_id)) return null
  const observation = parseHarnessTurnObservation(payload)
  if (!observation) return null
  if (observation.completed !== (outcome === 'completed')) return null
  return {
    outcome,
    activityRunId: payload.activity_run_id,
    observation,
  }
}

export function isSchedulerEvent(event: PipelineRunEventResponse): event is SchedulerEvent {
  const payload = recordValue(event.payload)
  if (!payload) return false
  switch (event.event_type) {
    case 'pipeline_run_created':
      return payload.commit_mode === 'allow' || payload.commit_mode === 'forbid'
    case 'pipeline_run_claimed':
      return nonEmptyString(payload.worker_id)
        && nonNegativeInteger(payload.attempt)
        && nonEmptyString(payload.activity_run_id)
        && nullableString(payload.lease_expires_at)
    case 'pipeline_step_started':
      return nonEmptyString(payload.activity_run_id)
        && nonNegativeInteger(payload.position)
        && (payload.harness === null || isHarnessIdentity(payload.harness))
    case 'pipeline_step_completed':
    case 'pipeline_step_failed':
      return nonEmptyString(payload.activity_run_id)
        && payload.status === event.event_type.replace('pipeline_step_', '')
        && nonEmptyString(payload.started_at)
        && nonEmptyString(payload.completed_at)
        && optionalString(payload.error)
    default:
      return false
  }
}

function harnessTurnOutcome(eventType: string): HarnessTurnOutcome | null {
  switch (eventType) {
    case 'harness_turn_completed':
    case 'codex_turn_completed':
      return 'completed'
    case 'harness_turn_failed':
    case 'codex_turn_failed':
      return 'failed'
    default:
      return null
  }
}

function isHarnessIdentity(value: unknown) {
  const harness = recordValue(value)
  return Boolean(harness
    && nonEmptyString(harness.kind)
    && nonEmptyString(harness.version)
    && isRecord(harness.config))
}

function isMaterializedSkills(value: unknown) {
  return Array.isArray(value) && value.every((item) => {
    const skill = recordValue(item)
    return Boolean(skill
      && nonEmptyString(skill.id)
      && nonEmptyString(skill.name)
      && Number.isInteger(skill.version)
      && Number(skill.version) > 0)
  })
}

function isUsage(value: unknown) {
  const usage = recordValue(value)
  return Boolean(usage && Object.values(usage).every(nonNegativeNumber))
}

function recordValue(value: unknown) {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function nullableString(value: unknown) {
  return value === null || typeof value === 'string'
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === 'string'
}

function optionalBoolean(value: unknown) {
  return value === undefined || typeof value === 'boolean'
}

function optionalTurnPhase(value: unknown) {
  return value === undefined || ['execute', 'proposal', 'aggregate', 'review'].includes(String(value))
}

function optionalAgentRole(value: unknown) {
  return value === undefined || ['generator', 'reviewer', 'aggregator'].includes(String(value))
}

function optionalPositiveInteger(value: unknown) {
  return value === undefined || (Number.isInteger(value) && Number(value) > 0)
}

function nullableNumber(value: unknown) {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function nonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function nullableNonNegativeNumber(value: unknown) {
  return value === null || nonNegativeNumber(value)
}

function nonNegativeInteger(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}
