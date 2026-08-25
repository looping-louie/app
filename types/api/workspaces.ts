import type { ExecutionHarness, ModelTarget } from './execution'

export interface WorkspaceDefaultsReplaceRequest {
  model_target?: ModelTarget | null
  harness?: ExecutionHarness | null
}

export interface WorkspaceDefaultsResponse {
  model_target: ModelTarget | null
  harness: ExecutionHarness | null
  updated_at: string
}
