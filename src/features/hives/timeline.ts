import type { Db } from '@/db/db'
import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'

export type SyncMark = 'synced' | 'pending' | 'attention'

type Common = { id: string; at: string; createdBy: string; author: string | null; sync: SyncMark }

export type TimelineItem =
  | (Common & {
      kind: 'inspection'
      inspection: ServerRow<'inspections'>
      /** Notes taken during this inspection, shown inside it. */
      notes: ServerRow<'hive_events'>[]
    })
  | (Common & { kind: 'event'; event: ServerRow<'hive_events'> })

/** Newest first; the same order and tie-break as the `hive_timeline` RPC (`at desc, id desc`). */
export function byNewest(a: { at: string; id: string }, b: { at: string; id: string }): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0
}

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(', ')

/**
 * The hive's newest `limit` items from the phone. "Cargar más" asks for a bigger limit and the
 * whole list is read again, so a page boundary can never drop or repeat an item.
 */
export async function localTimeline(
  db: Db,
  hiveId: string,
  limit: number,
): Promise<TimelineItem[]> {
  const inspections = (
    await db.getAllAsync<LocalRow>(
      `select * from inspections where hive_id = ? and deleted_at is null
       order by inspected_at desc, id desc limit ?`,
      [hiveId, limit],
    )
  ).map((row) => fromLocal('inspections', row))
  const events = (
    await db.getAllAsync<LocalRow>(
      `select * from hive_events where hive_id = ? and deleted_at is null
         and not (type = 'note' and inspection_id is not null)
       order by occurred_at desc, id desc limit ?`,
      [hiveId, limit],
    )
  ).map((row) => fromLocal('hive_events', row))

  const merged = [
    ...inspections.map((inspection) => ({
      kind: 'inspection' as const,
      id: inspection.id,
      at: inspection.inspected_at,
      inspection,
    })),
    ...events.map((event) => ({
      kind: 'event' as const,
      id: event.id,
      at: event.occurred_at,
      event,
    })),
  ]
    .sort(byNewest)
    .slice(0, limit)

  const shownInspections = merged.flatMap((m) => (m.kind === 'inspection' ? [m.id] : []))
  const notes = shownInspections.length
    ? (
        await db.getAllAsync<LocalRow>(
          `select * from hive_events where type = 'note' and deleted_at is null
           and inspection_id in (${placeholders(shownInspections.length)}) order by occurred_at`,
          shownInspections,
        )
      ).map((row) => fromLocal('hive_events', row))
    : []

  const ids = merged.map((m) => m.id)
  const marks = new Map<string, SyncMark>()
  if (ids.length) {
    const queued = await db.getAllAsync<{ row_id: string; state: string }>(
      `select row_id, state from outbox where table_name in ('inspections', 'hive_events')
       and row_id in (${placeholders(ids.length)})`,
      ids,
    )
    for (const q of queued) marks.set(q.row_id, q.state === 'pending' ? 'pending' : 'attention')
  }

  const authorIds = [
    ...new Set(
      merged.map((m) => (m.kind === 'inspection' ? m.inspection.created_by : m.event.created_by)),
    ),
  ]
  const authors = new Map<string, string>()
  if (authorIds.length) {
    const profiles = await db.getAllAsync<{ id: string; name: string }>(
      `select id, coalesce(nullif(display_name, ''), email) as name from profiles_cache
       where id in (${placeholders(authorIds.length)})`,
      authorIds,
    )
    for (const p of profiles) authors.set(p.id, p.name)
  }

  return merged.map((m): TimelineItem => {
    const createdBy = m.kind === 'inspection' ? m.inspection.created_by : m.event.created_by
    const common = {
      id: m.id,
      at: m.at,
      createdBy,
      author: authors.get(createdBy) ?? null,
      sync: marks.get(m.id) ?? 'synced',
    }
    return m.kind === 'inspection'
      ? {
          ...common,
          kind: 'inspection',
          inspection: m.inspection,
          notes: notes.filter((n) => n.inspection_id === m.id),
        }
      : { ...common, kind: 'event', event: m.event }
  })
}
