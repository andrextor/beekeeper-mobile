import { getDb } from '@/db/database'
import type { Db } from '@/db/db'
import type { SyncedTable } from '@/db/mapping'
import { applyServerRows } from '@/db/write'
import { deletePhotoFiles } from '@/lib/photo-files'
import type { PendingEntry } from './pending'
import { fetchServerRow } from './server'

const children: Record<SyncedTable, [SyncedTable, string][]> = {
  apiaries: [['hives', 'apiary_id']],
  hives: [
    ['inspections', 'hive_id'],
    ['hive_events', 'hive_id'],
    ['photos', 'hive_id'],
  ],
  inspections: [
    ['hive_events', 'inspection_id'],
    ['photos', 'inspection_id'],
  ],
  hive_events: [],
  photos: [],
}

/** A record that never reached the server goes with everything recorded under it (also local only). */
export async function removeLocal(
  db: Db,
  table: SyncedTable,
  id: string,
  /** Terminar's undo keeps the photos: they wait again with the restored draft (M9). */
  options: { keepPhotos?: boolean } = {},
): Promise<void> {
  for (const [child, column] of children[table]) {
    if (child === 'photos' && options.keepPhotos) continue
    const rows = await db.getAllAsync<{ id: string }>(
      `select id from ${child} where ${column} = ? and _on_server = 0`,
      [id],
    )
    for (const row of rows) await removeLocal(db, child, row.id, options)
  }
  if (table === 'photos') {
    const files = await db.getFirstAsync<{
      local_main_uri: string | null
      local_thumb_uri: string | null
    }>('select local_main_uri, local_thumb_uri from photos where id = ?', [id])
    // ponytail: files go before the transaction commits; a rollback would leave a row without them.
    deletePhotoFiles(files?.local_main_uri, files?.local_thumb_uri)
  }
  await db.runAsync('delete from outbox where table_name = ? and row_id = ?', [table, id])
  await db.runAsync(`delete from ${table} where id = ?`, [id])
}

/** A discarded hive change takes the `qr_relabel` event that announced its new code with it. */
async function dropQueuedRelabels(db: Db, hiveId: string): Promise<void> {
  const events = await db.getAllAsync<{ id: string }>(
    `select e.id from hive_events e join outbox o on o.table_name = 'hive_events' and o.row_id = e.id
     where e.hive_id = ? and e.type = 'qr_relabel' and e._on_server = 0`,
    [hiveId],
  )
  for (const event of events) await removeLocal(db, 'hive_events', event.id)
}

/**
 * "Descartar cambio": a record the server has goes back to the server's version (or away, if this
 * person can no longer read it); a record that never reached the server is removed. Run it through
 * `exclusive` so no push is in flight.
 */
export async function discardChange(entry: PendingEntry): Promise<void> {
  const db = await getDb()
  const table = entry.table_name
  const local = await db.getFirstAsync<{ _on_server: number }>(
    `select _on_server from ${table} where id = ?`,
    [entry.row_id],
  )
  const onServer = local?._on_server === 1
  const serverRow = onServer ? await fetchServerRow(table, entry.row_id) : null
  await db.transaction(async () => {
    if (table === 'hives') await dropQueuedRelabels(db, entry.row_id)
    if (!onServer) return removeLocal(db, table, entry.row_id)
    await db.runAsync('delete from outbox where id = ?', [entry.id])
    if (serverRow) await applyServerRows(db, table, [serverRow], true)
    else await db.runAsync(`delete from ${table} where id = ?`, [entry.row_id])
  })
}
