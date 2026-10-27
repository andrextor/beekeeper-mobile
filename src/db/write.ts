import type { Db } from './db'
import {
  fromLocal,
  type LocalRow,
  type ServerRow,
  type SyncedTable,
  toLocal,
  toPayload,
} from './mapping'

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

/** A second net behind the hidden buttons: an observador's write never reaches the outbox. */
async function refuseObservador(db: Db, writes: readonly { row: ServerRow }[]): Promise<void> {
  const orgs = [...new Set(writes.map((w) => w.row.organization_id))]
  const viewer = await db.getFirstAsync(
    `select 1 from members_cache where role = 'viewer' and organization_id in (${orgs.map(() => '?').join(', ')})`,
    orgs,
  )
  if (viewer) throw Object.assign(new Error('read-only role'), { code: '42501' })
}

/**
 * Every local write: the rows and their outbox entries in one transaction. Soft-deleting an
 * inspection soft-deletes its events too, as the server does (B4).
 */
export async function saveRows(
  db: Db,
  writes: readonly { table: SyncedTable; row: ServerRow }[],
  /** More local work that must commit or fail with these rows (e.g. deleting a draft). */
  extra?: (db: Db) => Promise<void>,
): Promise<void> {
  await refuseObservador(db, writes)
  await db.transaction(async () => {
    for (const { table, row } of writes) {
      await upsertDirty(db, table, row)
      if (table !== 'inspections' || !row.deleted_at) continue
      // ponytail: photos only change locally (the server cascades them, B4) until M9 pushes photos.
      await db.runAsync(
        'update photos set deleted_at = ? where inspection_id = ? and deleted_at is null',
        [row.deleted_at, row.id],
      )
      const events = await db.getAllAsync<LocalRow>(
        'select * from hive_events where inspection_id = ? and deleted_at is null',
        [row.id],
      )
      for (const e of events) {
        await upsertDirty(db, 'hive_events', {
          ...fromLocal('hive_events', e),
          deleted_at: row.deleted_at,
        })
      }
    }
    await extra?.(db)
  })
  for (const { table } of writes) for (const listener of listeners) listener(table)
}

export const saveRow = (db: Db, table: SyncedTable, row: ServerRow): Promise<void> =>
  saveRows(db, [{ table, row }])

/**
 * Rows the server returned (pull pages, push answers): `_on_server = 1`. A row with a local edit
 * still in the outbox keeps its values until that edit is pushed, unless `overwriteDirty`.
 */
export async function applyServerRows(
  db: Db,
  table: SyncedTable,
  rows: Record<string, unknown>[],
  overwriteDirty = false,
): Promise<void> {
  for (const row of rows) {
    const local = toLocal(table, row)
    const cols = Object.keys(local)
    const sets = cols.map((c) =>
      overwriteDirty
        ? `${c} = excluded.${c}`
        : `${c} = case when ${table}._dirty = 0 then excluded.${c} else ${table}.${c} end`,
    )
    if (overwriteDirty) sets.push('_dirty = 0')
    await db.runAsync(
      `insert into ${table} (${cols.join(', ')}, _dirty, _on_server)
       values (${cols.map(() => '?').join(', ')}, 0, 1)
       on conflict (id) do update set ${sets.join(', ')}, _on_server = 1`,
      cols.map((c) => local[c] ?? null),
    )
  }
}

/** Hives as they would be after `patches` (an event's effects); a hive not on the phone is skipped. */
export async function patchedHives(
  db: Db,
  patches: readonly { hiveId: string; patch: Record<string, unknown> }[],
): Promise<ServerRow<'hives'>[]> {
  // Several events on one hive (a queen change and a transfer) add up on the same row.
  const merged = new Map<string, Record<string, unknown>>()
  for (const { hiveId, patch } of patches) merged.set(hiveId, { ...merged.get(hiveId), ...patch })
  const rows: ServerRow<'hives'>[] = []
  for (const [hiveId, patch] of merged) {
    const row = await db.getFirstAsync<LocalRow>('select * from hives where id = ?', [hiveId])
    if (row) rows.push({ ...fromLocal('hives', row), ...patch } as ServerRow<'hives'>)
  }
  return rows
}
