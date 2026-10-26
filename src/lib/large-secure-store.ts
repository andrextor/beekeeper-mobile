import AsyncStorage from '@react-native-async-storage/async-storage'
import * as aesjs from 'aes-js'
import { getRandomValues } from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

/**
 * Supabase session storage: the value is AES-256-CTR encrypted into AsyncStorage and the key
 * lives in SecureStore, whose values are too small for a whole session (Supabase RN docs).
 * Every write uses a fresh key, so removing an item also discards its key.
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
    const encryptionKey = getRandomValues(new Uint8Array(32))
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey))
    await AsyncStorage.setItem(key, encrypt(encryptionKey, value))
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
    await SecureStore.deleteItemAsync(key)
  }
}

function encrypt(key: Uint8Array, value: string): string {
  const cipher = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1))
  return aesjs.utils.hex.fromBytes(cipher.encrypt(aesjs.utils.utf8.toBytes(value)))
}

function decrypt(hexKey: string, encrypted: string): string {
  const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(hexKey), new aesjs.Counter(1))
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(encrypted)))
}
