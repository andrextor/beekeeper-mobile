import type { Db } from '@/db/db'
import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { saveRows } from '@/db/write'
import { uuid } from '@/lib/ids'

const maxRelabels = 3

/**
 * A new hive whose QR code another hive already uses (`qr_taken`, odds ≈ 1 in 10^15): give it a
 * fresh code and re-queue it, with a `qr_relabel` event so the timeline tells the owner to reprint.
 * Both rows go in one transaction. After 3 relabels it stops (not bad luck: a person must look).
 */
export async function replaceTakenQrCode(
  db: Db,
  hiveId: string,
  newCode: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<LocalRow>('select * from hives where id = ?', [hiveId])
  if (!row) return false
  const relabels = await db.getFirstAsync<{ n: number }>(
    "select count(*) as n from hive_events where hive_id = ? and type = 'qr_relabel'",
    [hiveId],
  )
  if ((relabels?.n ?? 0) >= maxRelabels) return false
  const hive = fromLocal('hives', row)
  const now = new Date().toISOString()
  const event: ServerRow<'hive_events'> = {
    id: uuid(),
    organization_id: hive.organization_id,
    hive_id: hive.id,
    inspection_id: null,
    type: 'qr_relabel',
    occurred_at: now,
    details: { old_qr_code: hive.qr_code, new_qr_code: newCode },
    created_by: hive.created_by,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }
  await saveRows(db, [
    { table: 'hives', row: { ...hive, qr_code: newCode } },
    { table: 'hive_events', row: event },
  ])
  return true
}
