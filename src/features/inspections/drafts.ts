import type { Db } from '@/db/db'
import { fromLocal, type LocalRow } from '@/db/mapping'
import { isRecord } from '@/lib/guards'
import { emptyInspection, type InspectionDraft } from './schema'

export type DraftNote = {
  /** The future `hive_events` id: an edit updates the same event. */
  id: string
  slot: number
  text: string
  source: 'text' | 'voice'
  at: string
}

export type Draft = {
  /** The inspection id (new or being edited), so photos (M9) can link to it. */
  id: string
  organization_id: string
  hive_id: string
  is_edit: boolean
  fields: InspectionDraft
  notes: DraftNote[]
  created_at: string
  updated_at: string
}

type DraftRow = Omit<Draft, 'is_edit' | 'fields' | 'notes'> & {
  is_edit: number
  payload: string
  notes: string
}

const toDraft = (row: DraftRow): Draft => ({
  id: row.id,
  organization_id: row.organization_id,
  hive_id: row.hive_id,
  is_edit: row.is_edit === 1,
  fields: JSON.parse(row.payload) as InspectionDraft,
  notes: JSON.parse(row.notes) as DraftNote[],
  created_at: row.created_at,
  updated_at: row.updated_at,
})

/**
 * Inside a caller's transaction (Terminar's undo puts the draft back in the same one). `replace`
 * wins over another new draft of the hive (one opened during the undo window, empty in practice);
 * `ignore` keeps the existing one (two screens opening at once).
 */
export async function writeDraft(
  db: Db,
  draft: Draft,
  conflict: 'replace' | 'ignore' = 'replace',
): Promise<void> {
  await db.runAsync(
    `insert or ${conflict} into inspection_drafts
         (id, organization_id, hive_id, is_edit, payload, notes, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      draft.id,
      draft.organization_id,
      draft.hive_id,
      draft.is_edit ? 1 : 0,
      JSON.stringify(draft.fields),
      JSON.stringify(draft.notes),
      draft.created_at,
      draft.updated_at,
    ],
  )
}

async function insertDraft(db: Db, draft: Draft): Promise<void> {
  await db.transaction(() => writeDraft(db, draft, 'ignore'))
}

export async function getDraft(db: Db, id: string): Promise<Draft | null> {
  const row = await db.getFirstAsync<DraftRow>('select * from inspection_drafts where id = ?', [id])
  return row ? toDraft(row) : null
}

/** The hive's unfinished new inspection on this phone, if any. */
export async function findNewDraft(db: Db, hiveId: string): Promise<Draft | null> {
  const row = await db.getFirstAsync<DraftRow>(
    'select * from inspection_drafts where hive_id = ? and is_edit = 0',
    [hiveId],
  )
  return row ? toDraft(row) : null
}

/** Resumes the hive's new draft or starts one (`inspected_at` = now). `resumed` drives the toast. */
export async function openDraft(
  db: Db,
  input: { id: string; hiveId: string; organizationId: string; now: string },
): Promise<{ draft: Draft; resumed: boolean }> {
  const existing = await findNewDraft(db, input.hiveId)
  if (existing) return { draft: existing, resumed: true }
  const draft: Draft = {
    id: input.id,
    organization_id: input.organizationId,
    hive_id: input.hiveId,
    is_edit: false,
    fields: emptyInspection(input.now),
    notes: [],
    created_at: input.now,
    updated_at: input.now,
  }
  await insertDraft(db, draft)
  // Another screen may have created the hive's draft meanwhile: that one wins.
  const kept = await findNewDraft(db, input.hiveId)
  return kept && kept.id !== draft.id ? { draft: kept, resumed: true } : { draft, resumed: false }
}

/** A saved inspection copied into a draft (same ids), next to any new draft of its hive. */
export async function openEditDraft(
  db: Db,
  inspectionId: string,
  now: string,
): Promise<{ draft: Draft; resumed: boolean } | null> {
  const existing = await getDraft(db, inspectionId)
  if (existing) return { draft: existing, resumed: true }
  const row = await db.getFirstAsync<LocalRow>(
    'select * from inspections where id = ? and deleted_at is null',
    [inspectionId],
  )
  if (!row) return null
  const saved = fromLocal('inspections', row)
  const base = emptyInspection(saved.inspected_at)
  const fields = Object.fromEntries(
    Object.keys(base).map((key) => [key, saved[key as keyof typeof saved] ?? null]),
  ) as unknown as InspectionDraft
  const events = await db.getAllAsync<LocalRow>(
    `select * from hive_events where inspection_id = ? and type = 'note' and deleted_at is null
     order by occurred_at`,
    [inspectionId],
  )
  const notes = events.map((e, index): DraftNote => {
    const event = fromLocal('hive_events', e)
    const details = isRecord(event.details) ? event.details : {}
    return {
      id: event.id,
      slot: typeof details.slot === 'number' ? details.slot : index + 1,
      text: typeof details.text === 'string' ? details.text : '',
      source: details.source === 'voice' ? 'voice' : 'text',
      at: event.occurred_at,
    }
  })
  const draft: Draft = {
    id: saved.id,
    organization_id: saved.organization_id,
    hive_id: saved.hive_id,
    is_edit: true,
    fields,
    notes,
    created_at: now,
    updated_at: now,
  }
  await insertDraft(db, draft)
  return { draft, resumed: false }
}

/** Autosave: one update per (debounced) change. */
export async function updateDraft(
  db: Db,
  id: string,
  fields: InspectionDraft,
  notes: readonly DraftNote[],
): Promise<void> {
  await db.transaction(async () => {
    await db.runAsync(
      'update inspection_drafts set payload = ?, notes = ?, updated_at = ? where id = ?',
      [JSON.stringify(fields), JSON.stringify(notes), new Date().toISOString(), id],
    )
  })
}

export async function discardDraft(db: Db, id: string): Promise<void> {
  await db.transaction(async () => {
    await db.runAsync('delete from inspection_drafts where id = ?', [id])
  })
}

/** Puts a discarded draft back exactly as it was (Deshacer of "Descartar"). */
export async function restoreDraft(db: Db, draft: Draft): Promise<void> {
  await db.transaction(() => writeDraft(db, draft))
}

/** The next free note slot: 1 and 2 have their own tiles, "Nota +" takes 3, 4… */
export function nextSlot(notes: readonly DraftNote[]): number {
  let slot = 3
  while (notes.some((n) => n.slot === slot)) slot += 1
  return slot
}
