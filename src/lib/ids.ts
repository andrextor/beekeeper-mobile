import { getRandomValues, randomUUID } from 'expo-crypto'

/** Client-generated uuid v4 for every row and RPC id (api.md → Ids). */
export const uuid = (): string => randomUUID()

const crockford = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** A hive's printed code: 10 Crockford base32 characters (api.md → Hives). 256 % 32 = 0, so unbiased. */
export function randomQrCode(): string {
  return Array.from(getRandomValues(new Uint8Array(10)), (byte) => crockford[byte % 32]).join('')
}
