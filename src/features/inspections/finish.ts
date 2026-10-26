import type { Db } from '@/db/db'
import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { patchedHives, saveRows } from '@/db/write'
import { removeLocal } from '@/features/sync/discard'
import { fieldErrors } from '@/lib/form'
import { type Draft, writeDraft } from './drafts'
import { inspectionSchema } from './schema'

type Write = { table: 'inspections' | 'hive_events'; row: ServerRow }

/**
 * What Deshacer needs: the draft, for an edit the rows as they were before Terminar, and the hives
 * as they were before its events' effects (M10).
 */
export type Finished = { draft: Draft; before: Write[] | null; hivesBefore?: Write[] }

export type FinishOutcome =
  | { ok: true; finished: Finished }
  | { ok: false; problems: Record<string, string> }

const deleteDraft = (id: string) => (db: Db) =>
  db.runAsync('delete from inspection_drafts where id = ?', [id]).then(() => {})

async function savedRows(db: Db, inspectionId: string) {
  const inspection = await db.getFirstAsync<LocalRow>('select * from inspections where id = ?', [
    inspectionId,
  ])
  const children = await db.getAllAsync<LocalRow>(
    'select * from hive_events where inspection_id = ?',
    [inspectionId],
  )
  return {
    inspection: inspection ? fromLocal('inspections', inspection) : null,
    children: children.map((n) => fromLocal('hive_events', n)),
  }
}

/**
 * Terminar (spec M7): validate, then in one transaction the inspection, one `note` event per filled
 * slot (a removed one soft-deleted), their outbox entries, and the draft deleted.
 */
export async function finishDraft(
  db: Db,
  draft: Draft,
  userId: string,
  now: Date = new Date(),
): Promise<FinishOutcome> {
  const parsed = inspectionSchema(now).safeParse(draft.fields)
  if (!parsed.success) return { ok: false, problems: fieldErrors(parsed.error) }

  const at = now.toISOString()
  const saved = await savedRows(db, draft.id)
  // Deleted elsewhere while this edit was open: saving it would bring it back.
  if (draft.is_edit && saved.inspection?.deleted_at) {
    return {
      ok: false,
      problems: { inspected_at: 'Esta revisión fue eliminada. Descarta la edición.' },
    }
  }
  const inspection: ServerRow<'inspections'> = {
    ...parsed.data,
    id: draft.id,
    organization_id: draft.organization_id,
    hive_id: draft.hive_id,
    // An edit keeps who inspected; the server sets the author (B3 `force_author`).
    inspected_by: saved.inspection?.inspected_by ?? userId,
    created_by: saved.inspection?.created_by ?? userId,
    created_at: saved.inspection?.created_at ?? at,
    updated_at: at,
    deleted_at: null,
  }
  // Notes and the other events recorded during it (a dictated feeding) are its children.
  const drafted = [
    ...draft.notes.map((n) => ({
      id: n.id,
      type: 'note',
      at: n.at,
      details: { text: n.text, source: n.source, slot: n.slot },
    })),
    ...draft.events,
  ]
  const unchanged = (child: (typeof drafted)[number]) => {
    const old = saved.children.find((c) => c.id === child.id)
    return (
      old !== undefined &&
      old.deleted_at === null &&
      old.type === child.type &&
      old.occurred_at === child.at &&
      JSON.stringify(old.details) === JSON.stringify(child.details)
    )
  }
  // An edit rewrites only the notes and events it changed: the rest are not pushed again.
  const children = drafted
    .filter((child) => !unchanged(child))
    .map((child): Write => {
      const old = saved.children.find((c) => c.id === child.id)
      return {
        table: 'hive_events',
        row: {
          id: child.id,
          organization_id: draft.organization_id,
          hive_id: draft.hive_id,
          inspection_id: draft.id,
          type: child.type,
          occurred_at: child.at,
          details: child.details as ServerRow<'hive_events'>['details'],
          created_by: old?.created_by ?? userId,
          created_at: old?.created_at ?? at,
          updated_at: at,
          deleted_at: null,
        },
      }
    })
  const removed = saved.children
    .filter((c) => c.deleted_at === null && !drafted.some((d) => d.id === c.id))
    .map((c): Write => ({ table: 'hive_events', row: { ...c, deleted_at: at } }))

  const before: Write[] | null =
    draft.is_edit && saved.inspection
      ? [
          { table: 'inspections', row: saved.inspection },
          ...saved.children.map((c): Write => ({ table: 'hive_events', row: c })),
        ]
      : null

  // Effects of events recorded during the inspection (an owner's queen change, transfer…).
  const patches = draft.events.flatMap((e) => e.hivePatches ?? [])
  const hivesBefore: Write[] = (
    await patchedHives(
      db,
      patches.map((p) => ({ ...p, patch: {} })),
    )
  ).map((row) => ({ table: 'hives', row }))
  const hives: Write[] = (await patchedHives(db, patches)).map((row) => ({ table: 'hives', row }))

  await saveRows(
    db,
    [...hives, { table: 'inspections', row: inspection }, ...children, ...removed],
    deleteDraft(draft.id),
  )
  return { ok: true, finished: { draft, before, hivesBefore } }
}

/**
 * Deshacer of Terminar. An edit goes back to the rows it had. A new inspection the server never got
 * is removed with its notes; one it already has is soft-deleted (notes follow, B4). The draft comes
 * back with the same ids either way, so finishing again re-upserts the same rows.
 */
export async function undoFinish(
  db: Db,
  { draft, before, hivesBefore = [] }: Finished,
): Promise<void> {
  // The hives go back too: their changes came from this inspection's events.
  const putBack = async (tx: Db) => {
    await writeDraft(tx, draft)
  }
  if (hivesBefore.length) await saveRows(db, hivesBefore)
  if (before) {
    // Notes and events added by the edit did not exist before it: they go too.
    const added = [...draft.notes, ...draft.events].filter(
      (n) => !before.some((b) => b.row.id === n.id),
    )
    const sent = new Set(
      (
        await db.getAllAsync<{ id: string }>(
          `select id from hive_events where _on_server = 1 and id in (${added.map(() => '?').join(', ') || "''"})`,
          added.map((n) => n.id),
        )
      ).map((r) => r.id),
    )
    const now = new Date().toISOString()
    const soft = added.filter((n) => sent.has(n.id))
    const softRows = (
      await Promise.all(
        soft.map((n) =>
          db.getFirstAsync<LocalRow>('select * from hive_events where id = ?', [n.id]),
        ),
      )
    ).flatMap((r): Write[] =>
      r ? [{ table: 'hive_events', row: { ...fromLocal('hive_events', r), deleted_at: now } }] : [],
    )
    return saveRows(db, [...before, ...softRows], async (tx) => {
      for (const n of added) if (!sent.has(n.id)) await removeLocal(tx, 'hive_events', n.id)
      await putBack(tx)
    })
  }
  const row = await db.getFirstAsync<LocalRow>('select * from inspections where id = ?', [draft.id])
  if (!row) return db.transaction(() => putBack(db))
  const inspection = fromLocal('inspections', row)
  if (row._on_server !== 1) {
    return db.transaction(async () => {
      await removeLocal(db, 'inspections', draft.id, { keepPhotos: true })
      await putBack(db)
    })
  }
  await saveRows(
    db,
    [{ table: 'inspections', row: { ...inspection, deleted_at: new Date().toISOString() } }],
    putBack,
  )
}
