import type { PipelineRunEventResponse, PipelineRunResponse } from '~/types/api'
import { eventLatency, eventTokenCount } from '~/utils/pipelineRuns'

export interface ObservabilityChart {
  title: string
  description: string
  total: string
  totalLabel: string
  legend: string
  line: string
}

export function observabilityMetrics(runs: PipelineRunResponse[]) {
  const completed = runs.filter(run => run.status === 'completed')
  const terminal = runs.filter(run => ['completed', 'failed'].includes(run.status))
  const latencies = runs.flatMap(run => run.events.map(eventLatency)).filter(Boolean)
  return [
    { label: 'Completed runs', value: completed.length, trend: 'neutral' as const },
    { label: 'Success rate', value: terminal.length ? ((completed.length / terminal.length) * 100).toFixed(1) : '0.0', suffix: '%', trend: 'neutral' as const },
    { label: 'Average model latency', value: latencies.length ? (sum(latencies) / latencies.length / 1000).toFixed(2) : '0.00', suffix: 's', trend: 'neutral' as const },
    { label: 'Failed runs', value: runs.filter(run => run.status === 'failed').length, trend: 'neutral' as const },
  ]
}

export function observabilityCharts(runs: PipelineRunResponse[]): ObservabilityChart[] {
  const buckets = weekBuckets()
  const tokens = bucketEvents(runs, buckets, eventTokenCount)
  const latency = bucketEvents(runs, buckets, eventLatency)
  const volume = buckets.map(day => runs.filter(run => dayKey(run.created_at) === day).length)
  return [
    chart('Token usage', 'Codex token consumption reported by the execution ledger.', sum(tokens).toLocaleString(), 'Total tokens', 'Tokens', tokens),
    chart('Model latency', 'Time spent waiting for Codex responses.', `${(sum(latency) / 1000).toFixed(2)}s`, 'Total latency', 'Milliseconds', latency),
    chart('Run volume', 'Pipeline runs created during the last seven days.', String(sum(volume)), 'Created runs', 'Runs', volume),
  ]
}

export function observabilityLogs(runs: PipelineRunResponse[]) {
  return runs.flatMap(run => run.events.map(event => ({
    id: event.id,
    created: new Date(event.created_at).toLocaleString(),
    createdValue: event.created_at,
    type: event.type.replaceAll('_', ' '),
    run: run.id,
    activity: event.step_id ?? '—',
    error: errorMessage(event),
  }))).sort((first, second) => Date.parse(second.createdValue) - Date.parse(first.createdValue))
}

function bucketEvents(
  runs: PipelineRunResponse[],
  buckets: string[],
  value: (event: PipelineRunEventResponse) => number,
) {
  return buckets.map(day => sum(runs.flatMap(run => run.events)
    .filter(event => dayKey(event.created_at) === day)
    .map(value)))
}

function errorMessage(event: PipelineRunEventResponse) {
  return event.type === 'step_failed' ? String(event.payload.message || 'Activity failed') : '—'
}

function chart(title: string, description: string, total: string, totalLabel: string, legend: string, values: number[]): ObservabilityChart {
  return { title, description, total, totalLabel, legend, line: seriesPath(values) }
}

function seriesPath(values: number[]) {
  const maximum = Math.max(...values, 1)
  return values.map((value, index) => {
    const x = values.length === 1 ? 240 : (index / (values.length - 1)) * 480
    const y = 160 - (value / maximum) * 130
    return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function weekBuckets() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return dayKey(date.toISOString())
  })
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
