import type { Db } from '@/db/db'
import type { ServerRow } from '@/db/mapping'
import { patchedHives, saveRows } from '@/db/write'
import type { HivePatch } from './effects'

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
