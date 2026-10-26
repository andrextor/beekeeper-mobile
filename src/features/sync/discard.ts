import { getDb } from '@/db/database'
import { applyServerRows } from '@/db/write'
import type { PendingEntry } from './pending'
import { client, withTimeout } from './server'

/**
 * "Descartar cambio": a record the server has goes back to the server's version (or away, if this
 * person can no longer read it); a record that never reached the server is removed.
 */
export async function discardChange(entry: PendingEntry): Promise<void> {
  const db = await getDb()
  const table = entry.table_name
  const local = await db.getFirstAsync<{ _on_server: number }>(
    `select _on_server from ${table} where id = ?`,
    [entry.row_id],
  )
  let serverRow: Record<string, unknown> | null = null
  if (local?._on_server === 1) {
    const { data, error } = await withTimeout((signal) =>
      client.from(table).select('*').eq('id', entry.row_id).abortSignal(signal).maybeSingle(),
    )
    if (error) throw error
    serverRow = data as Record<string, unknown> | null
  }
  await db.transaction(async () => {
    await db.runAsync('delete from outbox where id = ?', [entry.id])
    if (serverRow) await applyServerRows(db, table, [serverRow], true)
    else await db.runAsync(`delete from ${table} where id = ?`, [entry.row_id])
  })
}
