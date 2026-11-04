import type { ExecutionHarness } from './execution'

export type ModelAvailabilityStatus = 'enabled' | 'disabled'

export interface ConfiguredModelAvailability {
  id: string
  status: ModelAvailabilityStatus
}

export interface UserSettings {
  default_model_id: string | null
  default_harness: ExecutionHarness | null
  default_model_availability: ModelAvailabilityStatus
  configured_models: ConfiguredModelAvailability[]
}

export type UserSettingsRequest = UserSettings

export interface UserResponse {
  id: string
  created_at: string
  updated_at: string
  settings: UserSettings
}
