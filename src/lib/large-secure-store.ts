import AsyncStorage from '@react-native-async-storage/async-storage'
import * as aesjs from 'aes-js'
import { getRandomValues } from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

/**
 * Supabase session storage: the value is AES-256-CTR encrypted into AsyncStorage and the key
 * lives in SecureStore, whose values are too small for a whole session (Supabase RN docs).
 * The key is created once per item and dropped by removeItem (sign-out), so each token refresh is
 * one AsyncStorage write: a kill mid-write can never pair a new key with old ciphertext.
 * Each write starts CTR at a fresh random 16-byte block (stored as `iv:ciphertext`), so the same key
 * never reuses a keystream.
 */
export class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key)
    if (!encrypted) return null
    const hexKey = await SecureStore.getItemAsync(key)
    if (!hexKey) return null
    return decrypt(hexKey, encrypted)
  }

  async setItem(key: string, value: string): Promise<void> {
    let hexKey = await SecureStore.getItemAsync(key)
    if (!hexKey) {
      hexKey = aesjs.utils.hex.fromBytes(getRandomValues(new Uint8Array(32)))
      // An old ciphertext would not match the new key.
      await AsyncStorage.removeItem(key)
      await SecureStore.setItemAsync(key, hexKey)
    }
    await AsyncStorage.setItem(key, encrypt(aesjs.utils.hex.toBytes(hexKey), value))
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
    await SecureStore.deleteItemAsync(key)
  }
}

function encrypt(key: Uint8Array, value: string): string {
  const iv = getRandomValues(new Uint8Array(16))
  const cipher = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(iv))
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value))
  return `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(encrypted)}`
}

/** null for anything not written by `encrypt` (Supabase then treats it as no session). */
function decrypt(hexKey: string, stored: string): string | null {
  const [iv, encrypted] = stored.split(':')
  if (!iv || !encrypted) return null
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(hexKey),
    new aesjs.Counter(aesjs.utils.hex.toBytes(iv)),
  )
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(encrypted)))
}
