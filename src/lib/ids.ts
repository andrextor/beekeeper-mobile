import { randomUUID } from 'expo-crypto'

/** Client-generated uuid v4 for every row and RPC id (api.md → Ids). */
export const uuid = (): string => randomUUID()
