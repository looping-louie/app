import type { ApiErrorEnvelope } from '~/types/api'

export function apiErrorMessage(cause: unknown, fallback = 'The request could not be completed.') {
  if (!cause || typeof cause !== 'object') return fallback
  const data = (cause as { data?: unknown }).data
  if (isApiErrorEnvelope(data)) return data.error.message
  return cause instanceof Error && cause.message ? cause.message : fallback
}

export function apiErrorCode(cause: unknown) {
  const data = cause && typeof cause === 'object' ? (cause as { data?: unknown }).data : undefined
  return isApiErrorEnvelope(data) ? data.error.code : undefined
}

export function apiErrorDetails(cause: unknown) {
  const data = cause && typeof cause === 'object' ? (cause as { data?: unknown }).data : undefined
  return isApiErrorEnvelope(data) ? data.error.details : null
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== 'object') return false
  const error = (value as { error?: unknown }).error
  return Boolean(error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string')
}
