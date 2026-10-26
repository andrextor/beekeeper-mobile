import { getRandomValues } from 'expo-crypto'

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Same rule as B3 `hives.qr_code`: 10 Crockford base32 characters (no I, L, O, U). */
export const isQrCode = (value: string): boolean => /^[0-9A-HJKMNP-TV-Z]{10}$/.test(value)

/** A new hive's printed code. 256 % 32 = 0, so every character is equally likely. */
export function newQrCode(): string {
  return Array.from(getRandomValues(new Uint8Array(10)), (byte) => alphabet[byte % 32]).join('')
}

/** What a person types or a worn label gives: any case, spaces, dashes, O for 0, I or L for 1. */
export function normalizeQrCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
}

/** The printed label's content. */
export const qrPayload = (code: string): string => `landak://h/${code}`

/** The hive code in `landak://h/<code>` or a bare code; anything else (a website, another app) is `null`. */
export function parseQrPayload(text: string): string | null {
  const trimmed = text.trim()
  const link = /^landak:\/\/h\/([^/?#]+)\/?$/i.exec(trimmed)
  if (!link && /[:/]/.test(trimmed)) return null
  const code = normalizeQrCode(link?.[1] ?? trimmed)
  return isQrCode(code) ? code : null
}

/** "ABCDE-FGHIJ": the code under the QR, for typing it when the QR is damaged. */
export const groupedQrCode = (code: string): string => `${code.slice(0, 5)}-${code.slice(5)}`
