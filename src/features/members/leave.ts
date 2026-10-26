import type { Db } from '@/db/db'
import { syncNow } from '@/features/sync/triggers'
import { removeMember } from './api'

/** Unsent changes of the finca, matched like M3's purge does. */
export async function pendingForFinca(db: Db, organizationId: string): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    "select count(*) as n from outbox where json_extract(payload, '$.organization_id') = ?",
    [organizationId],
  )
  return row?.n ?? 0
}

/** The full sync notices the lost membership, purges the finca and switches the active one (M3). */
export async function leaveFinca(organizationId: string, userId: string): Promise<void> {
  await removeMember(organizationId, userId)
  await syncNow()
}
