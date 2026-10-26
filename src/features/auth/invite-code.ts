/**
 * What the person typed or pasted → "K7M2-9QXA" as they type. A pasted share text gives its
 * dashed code. The server also forgives O/0 and I/L mix-ups.
 */
export function formatInviteCode(input: string): string {
  const dashed = /(?<![0-9A-Za-z])[0-9A-Za-z]{4}-[0-9A-Za-z]{4}(?![0-9A-Za-z])/.exec(input)?.[0]
  const chars = (dashed ?? input)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 8)
  return chars.length > 4 ? `${chars.slice(0, 4)}-${chars.slice(4)}` : chars
}

export const isCompleteInviteCode = (formatted: string): boolean =>
  formatted.replace('-', '').length === 8
