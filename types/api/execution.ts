export interface ModelTarget {
  linked_service_id: string
  model_id: string
}

export type ExecutionHarnessKind = 'louie' | 'codex_cli'

export interface ExecutionHarness {
  kind: ExecutionHarnessKind
  version: 'v1'
  config: Record<string, never>
}

export interface ExecutionOverrides {
  model_id?: string | null
  harness?: ExecutionHarness | null
}
