import { z } from 'zod'

import { supabase } from '@/lib/supabase'
import { withTimeout } from './server'

const membershipSchema = z.object({
  organization_id: z.string(),
  organization_name: z.string(),
  role: z.enum(['owner', 'reviewer']),
})
const membershipsSchema = z.array(membershipSchema)

export type Membership = z.infer<typeof membershipSchema>
export type Role = Membership['role']

/** `my_memberships()`: the fincas and roles this person has now (soft-deleted fincas excluded). */
export async function fetchMemberships(): Promise<Membership[]> {
  const { data, error } = await withTimeout((signal) =>
    supabase.rpc('my_memberships').abortSignal(signal),
  )
  if (error) throw error
  return membershipsSchema.parse(data)
}

/** Validates a cached copy; anything unreadable counts as no fincas. */
export function parseMemberships(value: unknown): Membership[] {
  const parsed = membershipsSchema.safeParse(value)
  return parsed.success ? parsed.data : []
}

type Listener = (memberships: Membership[]) => void

const listeners = new Set<Listener>()

/** Each sync reloads the memberships; the session listens so a removed finca or a new role shows at once. */
export function onMembershipsPulled(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function announceMemberships(memberships: Membership[]): void {
  for (const listener of listeners) listener(memberships)
}
