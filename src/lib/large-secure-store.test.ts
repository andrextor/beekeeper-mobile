import { LargeSecureStore } from './large-secure-store'

const mockAsyncData = new Map<string, string>()
const mockSecureData = new Map<string, string>()

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => mockAsyncData.get(k) ?? null,
  setItem: async (k: string, v: string) => void mockAsyncData.set(k, v),
  removeItem: async (k: string) => void mockAsyncData.delete(k),
}))
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => mockSecureData.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void mockSecureData.set(k, v),
  deleteItemAsync: async (k: string) => void mockSecureData.delete(k),
}))
jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint8Array) => require('node:crypto').getRandomValues(array),
}))

describe('LargeSecureStore', () => {
  const store = new LargeSecureStore()
  const session = JSON.stringify({
    access_token: 'a'.repeat(3000),
    user: { email: 'á@landak.test' },
  })

  beforeEach(() => {
    mockAsyncData.clear()
    mockSecureData.clear()
  })

  it('round-trips a session larger than SecureStore allows, encrypted at rest', async () => {
    await store.setItem('sb-auth', session)
    expect(mockAsyncData.get('sb-auth')).not.toContain('access_token')
    expect(await store.getItem('sb-auth')).toBe(session)
  })

  it('returns null for a missing value or a missing key', async () => {
    expect(await store.getItem('sb-auth')).toBeNull()
    await store.setItem('sb-auth', session)
    mockSecureData.clear()
    expect(await store.getItem('sb-auth')).toBeNull()
  })

  it('removes the value and its key', async () => {
    await store.setItem('sb-auth', session)
    await store.removeItem('sb-auth')
    expect(mockAsyncData.size + mockSecureData.size).toBe(0)
  })
})
