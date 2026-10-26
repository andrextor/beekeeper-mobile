import { z } from 'zod'

import type { Role } from '@/features/sync/members'
import { withTimeout } from '@/features/sync/server'
import { supabase } from '@/lib/supabase'

const roleSchema = z.enum(['owner', 'reviewer'])

const memberSchema = z.object({
  user_id: z.string(),
  role: roleSchema,
  // Null when the profile is not readable (B2 policy); the row still counts.
  profiles: z
    .object({
      email: z.string(),
      display_name: z.string().nullable(),
      deactivated_at: z.string().nullable(),
    })
    .nullable(),
})

const inviteSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  role: roleSchema,
  expires_at: z.string(),
})

export type Member = z.infer<typeof memberSchema>
export type Invite = z.infer<typeof inviteSchema>
export type NewInvite = { invite_id: string; code: string; expires_at: string }

const nameOf = (m: Member) => (m.profiles?.display_name || m.profiles?.email || '').toLowerCase()

/** Owners first, then by name (email when there is none). */
export function sortMembers(members: readonly Member[]): Member[] {
  return [...members].sort(
    (a, b) =>
      Number(b.role === 'owner') - Number(a.role === 'owner') ||
      nameOf(a).localeCompare(nameOf(b), 'es'),
  )
}

export async function fetchMembers(organizationId: string): Promise<Member[]> {
  const { data, error } = await withTimeout((signal) =>
    supabase
      .from('organization_members')
      .select('role, user_id, profiles(email, display_name, deactivated_at)')
      .eq('organization_id', organizationId)
      .abortSignal(signal),
  )
  if (error) throw error
  return sortMembers(z.array(memberSchema).parse(data))
}

/** Pending codes only; RLS returns none to reviewers. Columns are listed: `select=*` is refused. */
export async function fetchInvites(organizationId: string): Promise<Invite[]> {
  const { data, error } = await withTimeout((signal) =>
    supabase
      .from('organization_invites')
      .select('id, label, role, expires_at')
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at')
      .abortSignal(signal),
  )
  if (error) throw error
  return z.array(inviteSchema).parse(data)
}

export async function createInvite(
  organizationId: string,
  role: Role,
  label: string,
): Promise<NewInvite> {
  const { data, error } = await withTimeout((signal) =>
    supabase
      .rpc('create_invite', {
        p_organization_id: organizationId,
        p_role: role,
        ...(label ? { p_label: label } : {}),
      })
      .abortSignal(signal),
  )
  if (error) throw error
  const invite = data?.[0]
  if (!invite) throw new Error('create_invite returned no row')
  return invite
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await withTimeout((signal) =>
    supabase.rpc('revoke_invite', { p_invite_id: inviteId }).abortSignal(signal),
  )
  if (error) throw error
}

export async function setMemberRole(organizationId: string, userId: string, role: Role) {
  const { error } = await withTimeout((signal) =>
    supabase
      .rpc('set_member_role', {
        p_organization_id: organizationId,
        p_user_id: userId,
        p_role: role,
      })
      .abortSignal(signal),
  )
  if (error) throw error
}

/** Removes someone (owner) or yourself (leave). */
export async function removeMember(organizationId: string, userId: string): Promise<void> {
  const { error } = await withTimeout((signal) =>
    supabase
      .rpc('remove_member', { p_organization_id: organizationId, p_user_id: userId })
      .abortSignal(signal),
  )
  if (error) throw error
}
