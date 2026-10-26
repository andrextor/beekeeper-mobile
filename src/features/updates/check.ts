const hourMs = 60 * 60_000

/** At most one check per hour, however often the app comes to the front. */
export function dueForCheck(lastCheck: number, now: number): boolean {
  return now - lastCheck >= hourMs
}

/** SemVer "x.y.z" comparison; anything unreadable is never newer. */
export function isNewer(candidate: string, current: string): boolean {
  const parse = (v: string) => (/^\d+\.\d+\.\d+$/.test(v) ? v.split('.').map(Number) : null)
  const a = parse(candidate)
  const b = parse(current)
  if (!a || !b) return false
  const i = a.findIndex((part, index) => part !== b[index])
  return i >= 0 && (a[i] ?? 0) > (b[i] ?? 0)
}
