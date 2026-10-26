import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'

import { supabase } from '@/lib/supabase'
import { registerWipe } from '@/lib/wipe'

const membershipSchema = z.object({
  organization_id: z.string(),
  organization_name: z.string(),
  role: z.enum(['owner', 'reviewer']),
})
const membershipsSchema = z.array(membershipSchema)

export type Membership = z.infer<typeof membershipSchema>
export type Role = Membership['role']

const cacheKey = 'memberships'
const activeKey = 'active_organization_id'

/** Server list, cached so the app opens offline with the last known fincas and roles. */
export async function fetchMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase.rpc('my_memberships')
  if (error) throw error
  const memberships = membershipsSchema.parse(data)
  await AsyncStorage.setItem(cacheKey, JSON.stringify(memberships))
  return memberships
}

export async function cachedMemberships(): Promise<Membership[]> {
  const raw = await AsyncStorage.getItem(cacheKey)
  if (!raw) return []
  try {
    const parsed = membershipsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export async function storedActiveOrganizationId(): Promise<string | null> {
  return SecureStore.getItemAsync(activeKey)
}

export async function storeActiveOrganizationId(id: string): Promise<void> {
  await SecureStore.setItemAsync(activeKey, id)
}

/** The last used finca if still a member, the only one if there is one, else none (the switcher asks). */
export function pickActive(memberships: Membership[], stored: string | null): string | null {
  if (stored && memberships.some((m) => m.organization_id === stored)) return stored
  return memberships.length === 1 ? (memberships[0]?.organization_id ?? null) : null
}

registerWipe(async () => {
  await AsyncStorage.removeItem(cacheKey)
  await SecureStore.deleteItemAsync(activeKey)
})
