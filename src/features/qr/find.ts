import { getDb } from '@/db/database'
import { withTimeout } from '@/features/sync/server'
import { requestSync } from '@/features/sync/triggers'
import { supabase } from '@/lib/supabase'
import { type LookupOutcome, lookupHive } from './lookup'

async function findOnServer(code: string) {
  const { data, error } = await withTimeout((signal) =>
    supabase
      .from('hives')
      .select('id, organization_id')
      .eq('qr_code', code)
      .is('deleted_at', null)
      .abortSignal(signal)
      .maybeSingle(),
  )
  if (error) throw error
  return data
}

/** The real lookup: this phone's database, the server under RLS, a full sync when needed. */
export async function findHive(code: string, isOwner: boolean): Promise<LookupOutcome> {
  return lookupHive(code, {
    db: await getDb(),
    findOnServer,
    syncAll: () => requestSync('full'),
    isOwner,
  })
}
