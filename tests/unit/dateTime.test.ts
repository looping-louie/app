import { describe, expect, it } from 'vitest'
import { formatCompactRelativeTime } from '~/composables/useDateTime'

describe('formatCompactRelativeTime', () => {
  const now = Date.parse('2026-10-15T12:00:00Z')

  it.each([
    ['2026-10-15T11:59:40Z', '0m'],
    ['2026-10-15T11:15:00Z', '45m'],
    ['2026-10-15T10:00:00Z', '2h'],
    ['2026-10-12T12:00:00Z', '3d'],
    ['2026-09-24T12:00:00Z', '3w'],
    ['2026-08-15T12:00:00Z', '2mo'],
    ['2025-10-15T12:00:00Z', '1y'],
  ])('formats %s as %s', (timestamp, expected) => {
    expect(formatCompactRelativeTime(timestamp, now)).toBe(expected)
  })

  it('changes units exactly at the minute, hour, day, and week boundaries', () => {
    expect(formatCompactRelativeTime('2026-10-15T11:59:00Z', now)).toBe('1m')
    expect(formatCompactRelativeTime('2026-10-15T11:00:00Z', now)).toBe('1h')
    expect(formatCompactRelativeTime('2026-10-14T12:00:00Z', now)).toBe('1d')
    expect(formatCompactRelativeTime('2026-10-08T12:00:00Z', now)).toBe('1w')
  })

  it('uses completed calendar months and never emits zero months', () => {
    expect(formatCompactRelativeTime('2026-09-16T12:00:00Z', now)).toBe('4w')
    expect(formatCompactRelativeTime('2026-09-15T12:00:00Z', now)).toBe('1mo')
    expect(formatCompactRelativeTime('2026-01-31T12:00:00Z', Date.parse('2026-02-28T12:00:00Z'))).toBe('1mo')
  })

  it('uses completed calendar years and never emits zero years', () => {
    expect(formatCompactRelativeTime('2025-10-16T12:00:00Z', now)).toBe('11mo')
    expect(formatCompactRelativeTime('2025-10-15T12:00:00Z', now)).toBe('1y')
  })
})
