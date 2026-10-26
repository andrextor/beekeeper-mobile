import type { Db } from './db'
import { fromLocal, type LocalRow, type ServerRow, type SyncedTable, toLocal, toPayload } from './mapping'

type Listener = (table: SyncedTable) => void

const listeners = new Set<Listener>()

/** The sync triggers listen here to push shortly after a save. */
export function onLocalWrite(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function upsertDirty(db: Db, table: SyncedTable, row: ServerRow): Promise<void> {
  const local = toLocal(table, row)
  const cols = Object.keys(local)
  await db.runAsync(
    `insert into ${table} (${cols.join(', ')}, _dirty) values (${cols.map(() => '?').join(', ')}, 1)
     on conflict (id) do update set ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}, _dirty = 1`,
    cols.map((c) => local[c] ?? null),
  )
  const now = new Date().toISOString()
  // A second edit of a row still in the outbox replaces its payload: one push, latest state.
  await db.runAsync(
    `insert into outbox (id, table_name, row_id, payload, next_attempt_at, created_at)
     values (?, ?, ?, ?, ?, ?)
     on conflict (table_name, row_id) do update set
       payload = excluded.payload, attempts = 0, next_attempt_at = excluded.next_attempt_at,
       last_error = null, last_error_code = null, state = 'pending'`,
    [`${table}:${row.id}`, table, row.id, JSON.stringify(toPayload(table, row)), now, now],
  )
}

/**
 * Every local write: the row and its outbox entry in one transaction. Soft-deleting an inspection
 * soft-deletes its events and photos too, as the server does (B4).
 */
export async function saveRow(db: Db, table: SyncedTable, row: ServerRow): Promise<void> {
  await db.transaction(async () => {
    await upsertDirty(db, table, row)
    if (table !== 'inspections' || !row.deleted_at) return
    for (const child of ['hive_events', 'photos'] as const) {
      const children = await db.getAllAsync<LocalRow>(
        `select * from ${child} where inspection_id = ? and deleted_at is null`,
        [row.id],
      )
      for (const c of children) {
        await upsertDirty(db, child, { ...fromLocal(child, c), deleted_at: row.deleted_at })
      }
    }
  })
  for (const listener of listeners) listener(table)
}
