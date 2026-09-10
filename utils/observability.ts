import type { PipelineRunResponse } from '~/types/api'
import { harnessCommitSummary } from '~/utils/harnessObservations'
import { harnessTurns, runPrompt, turnErrorMessages, turnUsage, type PipelineRunSnapshot } from '~/utils/pipelineRuns'

interface ObservableTurn extends HarnessTurnRecord {
  run: PipelineRunResponse
}

export interface ObservabilityDistributionItem {
  label: string
  value: number
}

export interface ObservabilityDistribution {
  title: string
  description: string
  total: string
  totalLabel: string
  items: ObservabilityDistributionItem[]
}

export function observabilityMetrics(snapshots: PipelineRunSnapshot[]) {
  const turns = observableTurns(snapshots)
  const completed = turns.filter(turn => turn.outcome === 'completed').length
  const failed = turns.length - completed
  const durations = turns.flatMap(turn => turn.observation.duration_ms === null ? [] : [turn.observation.duration_ms])
  const tokens = turns.reduce((total, turn) => total + turnUsage(turn).total, 0)
  const divergences = turns.filter((turn) => {
    const { requested_model: requested, actual_model: actual } = turn.observation
    return Boolean(requested && actual && requested !== actual)
  }).length
  return [
    metric('Harness turns', turns.length),
    metric('Successful turns', completed),
    metric('Failed turns', failed),
    metric('Success rate', turns.length ? ((completed / turns.length) * 100).toFixed(1) : '0.0', '%'),
    metric('Average duration', durations.length ? (sum(durations) / durations.length / 1000).toFixed(2) : '0.00', 's'),
    metric('P95 duration', durations.length ? (percentile(durations, 0.95) / 1000).toFixed(2) : '0.00', 's'),
    metric('Total tokens', tokens.toLocaleString()),
    metric('Model divergences', divergences),
  ]
}

export function observabilityDistributions(snapshots: PipelineRunSnapshot[]): ObservabilityDistribution[] {
  const turns = observableTurns(snapshots)
  const writerTurns = turns.filter(turn => !turn.observation.phase || ['execute', 'aggregate'].includes(turn.observation.phase))
  const usages = turns.map(turnUsage)
  return [
    distribution(
      'Token usage',
      'Reported token counters across Harness turns.',
      [
        { label: 'Input', value: sum(usages.map(usage => usage.input)) },
        { label: 'Output', value: sum(usages.map(usage => usage.output)) },
        { label: 'Cached', value: sum(usages.map(usage => usage.cached)) },
      ],
      'Reported tokens',
    ),
    countedDistribution('Requested models', 'Models frozen by the API for execution.', turns.map(turn => turn.observation.requested_model ?? 'Unknown'), 'Turns'),
    countedDistribution('Actual models', 'Models reported by the Harness after execution.', turns.map(turn => turn.observation.actual_model ?? 'Unknown'), 'Turns'),
    countedDistribution('Reasoning effort', 'Reported reasoning effort for compatible Harnesses.', turns.map(reasoningEffort), 'Turns'),
    countedDistribution('Commit outcomes', 'Authorized Git outcomes for repository-writing turns.', writerTurns.map(commitOutcome), 'Writer turns'),
    countedDistribution('Changed files', 'Most frequently changed files reported by Harness turns.', turns.flatMap(turn => turn.observation.changed_files), 'File changes'),
    countedDistribution('Errors and diagnostics', 'Most frequent normalized errors and diagnostic messages.', turns.flatMap(turnErrorMessages), 'Occurrences'),
  ]
}

export function observabilityLogs(snapshots: PipelineRunSnapshot[]) {
  return observableTurns(snapshots).map((turn) => {
    const usage = turnUsage(turn)
    const requested = turn.observation.requested_model ?? 'Unknown'
    const actual = turn.observation.actual_model
    return {
      id: turn.event.id,
      created: new Date(turn.event.created_at).toLocaleString(),
      createdValue: turn.event.created_at,
      status: turn.outcome,
      run: runPrompt(turn.run).split('\n')[0]!.slice(0, 70),
      runId: turn.run.id,
      pipelineId: turn.run.pipeline_id,
      activityRun: turn.activityRunId,
      phase: turn.observation.phase
        ? `${turn.observation.phase} · ${turn.observation.role ?? 'agent'} · iteration ${turn.observation.iteration ?? 1}`
        : 'execute',
      model: actual && actual !== requested ? `${requested} → ${actual}` : actual ?? requested,
      duration: turn.observation.duration_ms === null ? '—' : `${(turn.observation.duration_ms / 1000).toFixed(2)}s`,
      tokens: usage.total.toLocaleString(),
      error: turnErrorMessages(turn).join(' · ') || '—',
    }
  }).sort((first, second) => Date.parse(second.createdValue) - Date.parse(first.createdValue))
}

function observableTurns(snapshots: PipelineRunSnapshot[]): ObservableTurn[] {
  return snapshots.flatMap(snapshot => harnessTurns(snapshot.events).map(turn => ({ ...turn, run: snapshot.run })))
}

function commitOutcome(turn: ObservableTurn) {
  const commit = harnessCommitSummary(turn.observation, turn.run.commit_mode)
  if (commit.authorization === 'forbidden') return 'Forbidden by policy'
  if (commit.authorization === 'not_reached') return 'Not reached'
  return {
    committed: 'Committed',
    failed: 'Failed',
    not_committed: 'Not committed',
    not_attempted: 'Not attempted',
  }[commit.outcome]
}

function reasoningEffort(turn: HarnessTurnRecord) {
  return turn.observation.harness.kind === 'codex_cli'
    ? turn.observation.reasoning_effort ?? 'Unknown'
    : 'Not reported'
}

function metric(label: string, value: string | number, suffix?: string) {
  return { label, value, suffix, trend: 'neutral' as const }
}

function countedDistribution(title: string, description: string, values: string[], totalLabel: string) {
  const counts = new Map<string, number>()
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1))
  return distribution(title, description, [...counts].map(([label, value]) => ({ label, value })), totalLabel)
}

function distribution(
  title: string,
  description: string,
  items: ObservabilityDistributionItem[],
  totalLabel: string,
): ObservabilityDistribution {
  const sorted = items.filter(item => item.value > 0).sort((first, second) => second.value - first.value || first.label.localeCompare(second.label))
  const visible = sorted.slice(0, 8)
  const remaining = sum(sorted.slice(8).map(item => item.value))
  if (remaining) visible.push({ label: 'Other', value: remaining })
  return {
    title,
    description,
    total: sum(items.map(item => item.value)).toLocaleString(),
    totalLabel,
    items: visible,
  }
}

function percentile(values: number[], value: number) {
  const sorted = [...values].sort((first, second) => first - second)
  return sorted[Math.max(0, Math.ceil(sorted.length * value) - 1)] ?? 0
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
