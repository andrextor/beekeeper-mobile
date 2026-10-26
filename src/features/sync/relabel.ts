import type { Db } from '@/db/db'
import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { saveRows } from '@/db/write'
import { isRecord } from '@/lib/guards'
import { uuid } from '@/lib/ids'

/**
 * A hive's new QR code and its `qr_relabel` event, in one transaction. An event still in the
 * outbox is updated instead of adding another (its `old_qr_code` stays the code the server knows),
 * so the timeline never shows a code that failed. Shared by the re-label screens (M5) and the
 * pusher's fix for a taken code.
 */
export async function relabelHive(db: Db, hiveId: string, newCode: string): Promise<boolean> {
  const row = await db.getFirstAsync<LocalRow>('select * from hives where id = ?', [hiveId])
  if (!row) return false
  const hive = fromLocal('hives', row)
  // Reused only while the hive's previous code is still queued too: once it reached the server,
  // that code is history and the next change is a new event.
  const queued = await db.getFirstAsync<LocalRow>(
    `select e.* from hive_events e join outbox o on o.table_name = 'hive_events' and o.row_id = e.id
     where e.hive_id = ? and e.type = 'qr_relabel'
       and exists (select 1 from outbox h where h.table_name = 'hives' and h.row_id = e.hive_id)`,
    [hiveId],
  )
  const now = new Date().toISOString()
  const pending = queued ? fromLocal('hive_events', queued) : null
  const pendingDetails = pending?.details
  const oldCode =
    isRecord(pendingDetails) && typeof pendingDetails.old_qr_code === 'string'
      ? pendingDetails.old_qr_code
      : hive.qr_code
  const event: ServerRow<'hive_events'> = pending
    ? { ...pending, occurred_at: now, details: { old_qr_code: oldCode, new_qr_code: newCode } }
    : {
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

const maxFixes = 3
const fixes = new Map<string, number>()

/**
 * A new hive whose code another hive already uses (`qr_taken`, odds ≈ 1 in 10^15): a fresh code,
 * re-queued. Three times per hive and app session at most: more is not bad luck, a person must look.
 */
export async function replaceTakenQrCode(
  db: Db,
  hiveId: string,
  newCode: string,
): Promise<boolean> {
  const done = fixes.get(hiveId) ?? 0
  if (done >= maxFixes) return false
  fixes.set(hiveId, done + 1)
  return relabelHive(db, hiveId, newCode)
}
