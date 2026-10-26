import { fromLocal, toLocal } from '@/db/mapping'
import { withTimeout } from '@/features/sync/server'
import { isRecord } from '@/lib/guards'
import { supabase } from '@/lib/supabase'
import type { TimelineItem } from './timeline'

export type RemoteCursor = { at: string; id: string } | null

const pageSize = 30

const recordOf = (data: unknown) => (isRecord(data) ? data : {})
const eventOf = (data: unknown) => fromLocal('hive_events', toLocal('hive_events', recordOf(data)))

/**
 * One page of `hive_timeline` (B4, RLS applies) while the phone's first download is not done.
 * The RPC returns notes as their own rows: those of an inspection on the page go inside it.
 */
export async function remoteTimelinePage(
  hiveId: string,
  before: RemoteCursor,
): Promise<{ items: TimelineItem[]; next: RemoteCursor }> {
  const { data, error } = await withTimeout((signal) =>
    supabase
      .rpc('hive_timeline', {
        p_hive_id: hiveId,
        p_limit: pageSize,
        ...(before ? { p_before: before.at, p_before_id: before.id } : {}),
      })
      .abortSignal(signal),
  )
  if (error) throw error
  const rows = data ?? []
  const inspections = new Set(rows.filter((r) => r.kind === 'inspection').map((r) => r.id))
  const items: TimelineItem[] = []
  const notes: ReturnType<typeof eventOf>[] = []
  for (const row of rows) {
    const common = {
      id: row.id,
      at: row.at,
      createdBy: row.created_by,
      // A member who left has no readable profile (the screen says "Antiguo miembro").
      author: row.author_name,
      sync: 'synced' as const,
    }
    if (row.kind === 'inspection') {
      const inspection = fromLocal('inspections', toLocal('inspections', recordOf(row.data)))
      items.push({ ...common, kind: 'inspection', inspection, notes: [] })
      continue
    }
    const event = eventOf(row.data)
    // Notes come before their inspection (newest first): attach them once the page is read.
    if (event.type === 'note' && event.inspection_id && inspections.has(event.inspection_id)) {
      notes.push(event)
    } else {
      items.push({ ...common, kind: 'event', event })
    }
  }
  for (const note of notes.reverse()) {
    const owner = items.find((i) => i.kind === 'inspection' && i.id === note.inspection_id)
    if (owner?.kind === 'inspection') owner.notes.push(note)
  }
  const last = rows.at(-1)
  return { items, next: rows.length === pageSize && last ? { at: last.at, id: last.id } : null }
}
