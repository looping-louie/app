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
  }
}
