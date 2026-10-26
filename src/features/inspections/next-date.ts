/** "YYYY-MM-DD" plus `days` calendar days (no time zone: dates only). */
export function addDays(day: string, days: number): string {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
