export interface WorkerHarnessCapabilityResponse {
  kind: 'louie' | 'codex_cli' | 'copilot_cli'
  version: 'v1'
  config: Record<string, never>
}

export interface WorkerInstanceProjectResponse {
  id: string
  registered_at: string
  last_heartbeat_at: string
  harnesses: WorkerHarnessCapabilityResponse[]
  enabled_at: string
  active: boolean
}