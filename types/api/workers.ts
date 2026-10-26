export interface WorkerHarnessCapabilityResponse {
  kind: 'louie' | 'codex_cli' | 'copilot_cli'
  version: 'v1'
  config: Record<string, never>
}

export interface WorkerResponse {
  id: string
  registered_at: string
  last_heartbeat_at: string
  harnesses: WorkerHarnessCapabilityResponse[]
}

export interface WorkerProjectEnablementResponse {
  worker_id: string
  project_id: string
  enabled_at: string
}

export interface WorkerInstanceProjectResponse extends WorkerResponse {
  enabled_at: string
  active: boolean
  active_claims: number
  capacity: number
}
