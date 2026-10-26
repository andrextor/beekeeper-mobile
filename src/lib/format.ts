const locale = 'es-CO'
const dayMs = 86_400_000

const dateFormat = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTimeFormat = new Intl.DateTimeFormat(locale, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const timeFormat = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
const numberFormat = new Intl.NumberFormat(locale)

const isValid = (date: Date) => !Number.isNaN(date.getTime())

/** A malformed timestamp shows as is instead of throwing during render. */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return isValid(date) ? dateFormat.format(date) : iso
}

/** A calendar date ("2026-11-01") read as a local day, so it never shifts to the day before. Other text shows as is. */
export function formatCalendarDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return date
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return isValid(parsed) ? dateFormat.format(parsed) : date
}

/** "9:40 a. m." */
export function formatTime(iso: string): string {
  const date = new Date(iso)
  return isValid(date) ? timeFormat.format(date) : iso
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return isValid(date) ? dateTimeFormat.format(date) : iso
}

function isWithinWeek(iso: string, now: Date): boolean {
  return Math.abs(new Date(iso).getTime() - now.getTime()) < 7 * dayMs
}

const units = {
  minute: ['minuto', 'minutos'],
  hour: ['hora', 'horas'],
  day: ['día', 'días'],
} as const

// Hermes (the app's JS engine) has no Intl.RelativeTimeFormat, so the Spanish is spelled out here.
function relative(value: number, unit: keyof typeof units): string {
  if (unit === 'minute' && value === 0) return 'ahora'
  if (unit === 'day' && value === -1) return 'ayer'
  if (unit === 'day' && value === 1) return 'mañana'
  const n = Math.abs(value)
  const word = units[unit][n === 1 ? 0 : 1]
  return value < 0 ? `hace ${n} ${word}` : `dentro de ${n} ${word}`
}

/** "hace 3 horas", "ayer", "hace 5 días" under a week; the absolute date after that. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  if (!isWithinWeek(iso, now)) return formatDate(iso)
  const diffMs = new Date(iso).getTime() - now.getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (Math.abs(minutes) < 60) return relative(minutes, 'minute')
  const hours = Math.round(diffMs / 3_600_000)
  if (Math.abs(hours) < 24) return relative(hours, 'hour')
  return relative(Math.round(diffMs / dayMs), 'day')
}

/** "Última revisión hace 3 días" under a week, "Última revisión el 14 oct 2026" after. */
export function formatLastInspection(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Sin revisiones'
  const when = formatRelative(iso, now)
  return isWithinWeek(iso, now) ? `Última revisión ${when}` : `Última revisión el ${when}`
}

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function formatAltitude(meters: number): string {
  return `${formatNumber(meters)} m`
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Colony age from a calendar date ("2025-03-14"): "3 meses", "1 año y 7 meses". */
export function formatColonyAge(startedOn: string, now: Date = new Date()): string {
  const [year = 0, month = 1, day = 1] = startedOn.split('-').map(Number)
  // A start on the 31st completes its month on the last day of a shorter month.
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const months =
    (now.getFullYear() - year) * 12 +
    (now.getMonth() + 1 - month) -
    (now.getDate() < Math.min(day, lastDay) ? 1 : 0)
  if (months < 1) return 'Menos de un mes'
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0) return plural(rest, 'mes', 'meses')
  const yearsText = plural(years, 'año', 'años')
  return rest ? `${yearsText} y ${plural(rest, 'mes', 'meses')}` : yearsText
}

export function formatAmount(value: number, unit: 'kg' | 'g' | 'l' | '°C'): string {
  return `${formatNumber(value)} ${unit}`
}
