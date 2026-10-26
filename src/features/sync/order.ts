import { type SyncedTable, syncedTables } from '@/db/mapping'

export type OutboxEntry = {
  id: string
  table_name: SyncedTable
  row_id: string
  payload: string
  attempts: number
  created_at: string
  /** The row's `_on_server` when the run started. */
  on_server: number
}

/** `final`: success completes the entry. A live-first push of a deletion is not final. */
export type Step = { entry: OutboxEntry; payload: Record<string, unknown>; final: boolean }

const rank = (table: SyncedTable) => syncedTables.indexOf(table)
const older = (a: { entry: OutboxEntry }, b: { entry: OutboxEntry }) =>
  a.entry.created_at.localeCompare(b.entry.created_at)

/**
 * Live rows parent-first, then deletions child-first (api.md → Sync push). A row created and
 * deleted offline goes up live first, so the children recorded under it have a parent.
 */
export function pushSteps(entries: OutboxEntry[]): Step[] {
  const parsed = entries.map((entry) => ({
    entry,
    payload: JSON.parse(entry.payload) as Record<string, unknown>,
  }))
  const deleted = (p: { payload: Record<string, unknown> }) => p.payload.deleted_at != null

  const live = parsed
    .filter((p) => !deleted(p) || p.entry.on_server === 0)
    .sort((a, b) => rank(a.entry.table_name) - rank(b.entry.table_name) || older(a, b))
    .map((p) => ({
      entry: p.entry,
      payload: { ...p.payload, deleted_at: null },
      final: !deleted(p),
    }))
  const deletions = parsed
    .filter(deleted)
    .sort((a, b) => rank(b.entry.table_name) - rank(a.entry.table_name) || older(a, b))
    .map((p) => ({ ...p, final: true }))
  return [...live, ...deletions]
}
