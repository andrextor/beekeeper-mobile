import { LargeSecureStore } from './large-secure-store'

const asyncData = new Map<string, string>()
const secureData = new Map<string, string>()

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => asyncData.get(k) ?? null,
  setItem: async (k: string, v: string) => void asyncData.set(k, v),
  removeItem: async (k: string) => void asyncData.delete(k),
}))
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => secureData.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void secureData.set(k, v),
  deleteItemAsync: async (k: string) => void secureData.delete(k),
}))
jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint8Array) => require('node:crypto').getRandomValues(array),
}))

describe('LargeSecureStore', () => {
  const store = new LargeSecureStore()
  const session = JSON.stringify({ access_token: 'a'.repeat(3000), user: { email: 'á@landak.test' } })

  beforeEach(() => {
    asyncData.clear()
    secureData.clear()
  })

  it('round-trips a session larger than SecureStore allows, encrypted at rest', async () => {
    await store.setItem('sb-auth', session)
    expect(asyncData.get('sb-auth')).not.toContain('access_token')
    expect(await store.getItem('sb-auth')).toBe(session)
  })

  it('returns null for a missing value or a missing key', async () => {
    expect(await store.getItem('sb-auth')).toBeNull()
    await store.setItem('sb-auth', session)
    secureData.clear()
    expect(await store.getItem('sb-auth')).toBeNull()
  })

  it('removes the value and its key', async () => {
    await store.setItem('sb-auth', session)
    await store.removeItem('sb-auth')
    expect(asyncData.size + secureData.size).toBe(0)
  })
})
