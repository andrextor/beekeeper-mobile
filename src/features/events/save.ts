import type { Db } from '@/db/db'
import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { saveRows } from '@/db/write'
import type { HivePatch } from './effects'

/** Patched hive rows from the phone's current ones (a missing hive is skipped). */
export async function patchedHives(
  db: Db,
  patches: readonly HivePatch[],
): Promise<ServerRow<'hives'>[]> {
  const rows: ServerRow<'hives'>[] = []
  for (const { hiveId, patch } of patches) {
    const row = await db.getFirstAsync<LocalRow>('select * from hives where id = ?', [hiveId])
    if (row) rows.push({ ...fromLocal('hives', row), ...patch })
  }
  return rows
}

/** The event and its hive updates in one transaction: two outbox entries, hive first (M3 rank). */
export async function saveEvent(
  db: Db,
  event: ServerRow<'hive_events'>,
  patches: readonly HivePatch[],
): Promise<void> {
  const hives = await patchedHives(db, patches)
  await saveRows(db, [
    ...hives.map((row) => ({ table: 'hives' as const, row })),
    { table: 'hive_events', row: event },
  ])
}
