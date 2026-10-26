import { getRandomValues } from 'expo-crypto'

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Same rule as B3 `hives.qr_code`: 10 Crockford base32 characters (no I, L, O, U). */
export const isQrCode = (value: string): boolean => /^[0-9A-HJKMNP-TV-Z]{10}$/.test(value)

/** A new hive's printed code. 256 % 32 = 0, so every character is equally likely. */
export function newQrCode(): string {
  return Array.from(getRandomValues(new Uint8Array(10)), (byte) => alphabet[byte % 32]).join('')
}
