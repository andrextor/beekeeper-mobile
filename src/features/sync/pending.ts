import { getDb } from '@/db/database'
import type { SyncedTable } from '@/db/mapping'
import { useLocalQuery } from '@/db/useLocalQuery'
import { formatDate, formatRelative } from '@/lib/format'
import { eventTypeLabels, label } from '@/lib/labels'

export type PendingEntry = {
  id: string
  table_name: SyncedTable
  row_id: string
  payload: string
  attempts: number
  next_attempt_at: string
  last_error: string | null
  state: 'pending' | 'failed_permanent'
  hive_name: string | null
}

/** Outbox rows not yet on the server, failed ones included (the sign-out warning counts them). */
export async function pendingCount(): Promise<number> {
  const db = await getDb()
  return (await db.getFirstAsync<{ n: number }>('select count(*) as n from outbox'))?.n ?? 0
}

const entriesSql = `select o.id, o.table_name, o.row_id, o.payload, o.attempts, o.next_attempt_at,
    o.last_error, o.state, h.name as hive_name
  from outbox o
  left join hives h on h.id = case when o.table_name = 'hives' then o.row_id
    else json_extract(o.payload, '$.hive_id') end
  order by o.state = 'failed_permanent' desc, o.created_at
  limit 200`

/** "Requiere atención" first, then the queue in the order it was saved. */
export function usePendingEntries(): PendingEntry[] {
  return useLocalQuery<PendingEntry>(entriesSql, [], ['outbox', 'hives']).rows
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

/** "Colmena C-12", "Revisión de C-12 · 25 oct 2026", "Nota · C-12". */
export function entryTitle(entry: PendingEntry): string {
  const p = JSON.parse(entry.payload) as Record<string, unknown>
  const hive = entry.hive_name ?? 'colmena'
  const titles: Record<SyncedTable, () => string> = {
    apiaries: () => `Apiario ${text(p.name)}`,
    hives: () => `Colmena ${text(p.name)}`,
    inspections: () => `Revisión de ${hive} · ${formatDate(text(p.inspected_at))}`,
    hive_events: () => `${label(eventTypeLabels, text(p.type))} · ${hive}`,
    photos: () => `Foto · ${hive}`,
  }
  const title = titles[entry.table_name]()
  return p.deleted_at ? `${title} (eliminación)` : title
}

/** "En cola", or the attempt count and when the next one goes. */
export function entryDetail(entry: PendingEntry, now: Date = new Date()): string {
  if (entry.attempts === 0) return 'En cola'
  const soon = new Date(entry.next_attempt_at).getTime() - now.getTime() < 60_000
  const next = soon
    ? 'se reintenta en un momento'
    : `próximo ${formatRelative(entry.next_attempt_at, now)}`
  return `Intento ${entry.attempts} · ${next}`
}
