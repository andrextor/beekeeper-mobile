/**
 * What the person typed or pasted → "K7M2-9QXA" as they type. A pasted share text gives its
 * code. The server also forgives O/0 and I/L mix-ups.
 */
export function formatInviteCode(input: string): string {
  const chars = (pastedCode(input) ?? input)
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, 8)
  return chars.length > 4 ? `${chars.slice(0, 4)}-${chars.slice(4)}` : chars
}

export const isCompleteInviteCode = (formatted: string): boolean =>
  formatted.replace('-', '').length === 8

/** In a pasted sentence, the last standalone "XXXX-XXXX" or 8-character word is the code. */
function pastedCode(input: string): string | undefined {
  if (!/\s/.test(input.trim())) return undefined
  const words = input.match(/(?<![0-9A-Za-z])[0-9A-Za-z]{4}-?[0-9A-Za-z]{4}(?![0-9A-Za-z-])/g)
  return words ? words[words.length - 1] : undefined
}
