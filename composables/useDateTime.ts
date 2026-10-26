const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const preciseDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
})

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

export function formatCompactRelativeTime(value: string, now = Date.now()): string {
  const createdAt = new Date(value)
  if (Number.isNaN(createdAt.getTime())) return value

  const elapsed = Math.max(0, now - createdAt.getTime())
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m`
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h`
  if (elapsed < WEEK_MS) return `${Math.floor(elapsed / DAY_MS)}d`

  const nowDate = new Date(now)
  const months = wholeCalendarMonths(createdAt, nowDate)
  if (months < 1) return `${Math.floor(elapsed / WEEK_MS)}w`
  if (months < 12) return `${months}mo`
  return `${Math.floor(months / 12)}y`
}

function wholeCalendarMonths(from: Date, to: Date): number {
  const candidateMonths = Math.max(
    0,
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth(),
  )
  return addCalendarMonthsClamped(from, candidateMonths) > to
    ? candidateMonths - 1
    : candidateMonths
}

function addCalendarMonthsClamped(value: Date, months: number): Date {
  const targetYear = value.getUTCFullYear() + Math.floor((value.getUTCMonth() + months) / 12)
  const targetMonth = (value.getUTCMonth() + months) % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    Math.min(value.getUTCDate(), lastDay),
    value.getUTCHours(),
    value.getUTCMinutes(),
    value.getUTCSeconds(),
    value.getUTCMilliseconds(),
  ))
}

export function useDateTime() {
  function format(value: string | null | undefined, formatter: Intl.DateTimeFormat): string {
    if (!value) return ''
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : formatter.format(date)
  }

  return {
    formatDate: (value: string | null | undefined) => format(value, dateFormatter),
    formatDateTime: (value: string | null | undefined) => format(value, dateTimeFormatter),
    formatPreciseDateTime: (value: string | null | undefined) => format(value, preciseDateTimeFormatter),
    formatCompactRelativeTime,
  }
}
