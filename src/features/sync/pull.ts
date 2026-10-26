import type { Db } from '@/db/db'
import { type SyncedTable, syncedTables } from '@/db/mapping'
import { applyServerRows } from '@/db/write'
import { announceMemberships, fetchMemberships, type Membership } from './members'
import { client, withTimeout } from './server'

export type PullTable = SyncedTable | 'profiles'
export type Row = Record<string, unknown>
/** Rows after `at` (and, on later pages, after `id` at the same instant), oldest first. */
export type After = { at: string; id: string | null }

export type Source = {
  memberships(): Promise<Membership[]>
  page(table: PullTable, organizationId: string, after: After): Promise<Row[]>
}

export const epoch = '1970-01-01T00:00:00.000Z'
export const pageSize = 500
const maxPages = 40
const overlapMs = 2 * 60_000
const lostAccess = 'Ya no tienes acceso a esta finca.'

const server: Source = {
  memberships: fetchMemberships,
  async page(table, organizationId, after) {
    const columns =
      table === 'profiles' ? 'id, email, display_name, deactivated_at, updated_at' : '*'
    let query = client.from(table).select(columns)
    if (organizationId) query = query.eq('organization_id', organizationId)
    query =
      after.id === null
        ? query.gt('updated_at', after.at)
        : query.or(`updated_at.gt."${after.at}",and(updated_at.eq."${after.at}",id.gt.${after.id})`)
    const { data, error } = await withTimeout((signal) =>
      query.order('updated_at').order('id').limit(pageSize).abortSignal(signal),
    )
    if (error) throw error
    return (data ?? []) as Row[]
  },
}

/** Every local row of a finca this person lost, except unsent changes: those wait for a decision. */
async function purge(db: Db, organizationId: string): Promise<void> {
  await db.runAsync(
    `update outbox set state = 'failed_permanent', last_error = ?, last_error_code = 'lost_access'
     where json_extract(payload, '$.organization_id') = ?`,
    [lostAccess, organizationId],
  )
  for (const table of syncedTables) {
    await db.runAsync(
      `delete from ${table} where organization_id = ?
       and id not in (select row_id from outbox where table_name = ?)`,
      [organizationId, table],
    )
  }
  await db.runAsync('delete from sync_state where organization_id = ?', [organizationId])
}

/** Memberships are hard-deleted on the server, so the whole list is compared on every run. */
async function syncMembers(db: Db, memberships: Membership[]): Promise<void> {
  const known = (
    await db.getAllAsync<{ organization_id: string }>('select organization_id from members_cache')
  ).map((m) => m.organization_id)
  const current = new Set(memberships.map((m) => m.organization_id))
  const removed = known.filter((id) => !current.has(id))
  const gained = memberships.some((m) => !known.includes(m.organization_id))

  await db.transaction(async () => {
    await db.runAsync('delete from members_cache')
    for (const m of memberships) {
      await db.runAsync(
        'insert into members_cache (organization_id, organization_name, role) values (?, ?, ?)',
        [m.organization_id, m.organization_name, m.role],
      )
    }
    for (const id of removed) await purge(db, id)
    // Former co-members are no longer readable (B7); new co-members' profiles predate the cursor.
    if (removed.length > 0) await db.runAsync('delete from profiles_cache')
    if (removed.length > 0 || gained) {
      await db.runAsync("delete from sync_state where table_name = 'profiles'")
    }
  })
}

async function saveProfiles(db: Db, rows: Row[]): Promise<void> {
  for (const r of rows) {
    await db.runAsync(
      `insert into profiles_cache (id, email, display_name, deactivated_at, updated_at)
       values (?, ?, ?, ?, ?)
       on conflict (id) do update set email = excluded.email, display_name = excluded.display_name,
         deactivated_at = excluded.deactivated_at, updated_at = excluded.updated_at`,
      [r.id, r.email, r.display_name ?? null, r.deactivated_at ?? null, r.updated_at].map((v) =>
        typeof v === 'string' ? v : null,
      ),
    )
  }
}

/**
 * Two minutes back catches rows whose transaction committed after a later one (api.md → Sync
 * pull). Microseconds are cut first: Hermes may not parse more than milliseconds.
 */
export function withOverlap(at: string): string {
  const time = new Date(at.replace(/(\.\d{3})\d+/, '$1')).getTime()
  return Number.isNaN(time) ? at : new Date(time - overlapMs).toISOString()
}

/** One table of one finca (`''` for profiles), from its cursor, at most 40 pages per run. */
async function pullTable(db: Db, source: Source, organizationId: string, table: PullTable) {
  const state = await db.getFirstAsync<{ cursor: string }>(
    'select cursor from sync_state where organization_id = ? and table_name = ?',
    [organizationId, table],
  )
  let after: After = { at: state?.cursor ?? epoch, id: null }
  let moved = false
  let complete = false
  for (let page = 0; page < maxPages; page++) {
    const rows = await source.page(table, organizationId, after)
    await db.transaction(async () => {
      if (table === 'profiles') await saveProfiles(db, rows)
      else await applyServerRows(db, table, rows)
    })
    const last = rows.at(-1)
    if (last) {
      after = { at: String(last.updated_at), id: String(last.id) }
      moved = true
    }
    if (rows.length < pageSize) {
      complete = true
      break
    }
  }
  const cursor = moved ? withOverlap(after.at) : after.at
  await db.transaction(async () => {
    await db.runAsync(
      `insert into sync_state (organization_id, table_name, cursor, initial_pull_done, last_pull_at)
       values (?, ?, ?, ?, ?)
       on conflict (organization_id, table_name) do update set cursor = excluded.cursor,
         initial_pull_done = max(sync_state.initial_pull_done, excluded.initial_pull_done),
         last_pull_at = excluded.last_pull_at, last_error = null`,
      [organizationId, table, cursor, complete ? 1 : 0, new Date().toISOString()],
    )
  })
}

/**
 * Memberships first (purging lost fincas), then each finca's tables parent-first with its own
 * cursors, so a finca joined later still gets its whole history; then profiles.
 */
export async function pull(db: Db, source: Source = server): Promise<void> {
  const memberships = await source.memberships()
  await syncMembers(db, memberships)
  announceMemberships(memberships)
  for (const m of memberships) {
    for (const table of syncedTables) await pullTable(db, source, m.organization_id, table)
  }
  await pullTable(db, source, '', 'profiles')
}
