import { errorCode } from '@/lib/errors'
import { uuid } from '@/lib/ids'
import { supabase } from '@/lib/supabase'

/**
 * `create_organization` is idempotent for the same id, so a retry after a timeout must reuse it:
 * the caller keeps `id` across taps. `id_taken` (someone else's finca has it) replaces it once.
 */
export async function createOrganization(id: { current: string }, name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_organization', {
    p_id: id.current,
    p_name: name,
  })
  if (!error) return data
  if (errorCode(error) !== 'id_taken') throw error
  id.current = uuid()
  const retry = await supabase.rpc('create_organization', { p_id: id.current, p_name: name })
  if (retry.error) throw retry.error
  return retry.data
}

/** After joining or creating, the finca must be in a fresh `my_memberships()` before it becomes active. */
export function includesFinca(memberships: { organization_id: string }[], id: string): void {
  if (!memberships.some((m) => m.organization_id === id)) {
    throw new Error('membership not loaded yet')
  }
}

export async function acceptInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invite', { p_code: code })
  if (error) throw error
  return data
}

/** A plain update returns 200 and no rows when RLS refuses it (api.md), so ask for the row back. */
export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select('id')
  if (error) throw error
  if (data.length === 0)
    throw Object.assign(new Error('profiles update refused'), { code: '42501' })
}
