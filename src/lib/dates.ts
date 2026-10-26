// Calendar dates as "YYYY-MM-DD": plain day arithmetic in UTC, so no time zone can shift a day.

const utc = (day: string) => {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Whole days from `from` to `to`. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

/** `day` plus `days` calendar days. */
export function addDays(day: string, days: number): string {
  return new Date(utc(day) + days * 86_400_000).toISOString().slice(0, 10)
}

/** The phone's calendar day as "YYYY-MM-DD" (not UTC: in Colombia the evening is already tomorrow in UTC). */
export function localDay(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
