import type { Db } from '@/db/db'
import { fromLocal, type LocalRow } from '@/db/mapping'
import { saveRow } from '@/db/write'
import { uuid } from '@/lib/ids'

/**
 * A new hive whose QR code another hive already uses (`qr_taken`, odds ≈ 1 in 10^15): give it a
 * fresh code and re-queue it, with a `qr_relabel` event so the timeline tells the owner to reprint.
 */
export async function replaceTakenQrCode(
  db: Db,
  hiveId: string,
  newCode: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<LocalRow>('select * from hives where id = ?', [hiveId])
  if (!row) return false
  const hive = fromLocal('hives', row)
  const now = new Date().toISOString()
  await saveRow(db, 'hives', { ...hive, qr_code: newCode })
  await saveRow(db, 'hive_events', {
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
  })
  return true
}
