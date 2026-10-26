import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { type Draft, findNewDraft, openDraft, openEditDraft, updateDraft } from './drafts'
import { finishDraft, undoFinish } from './finish'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))
jest.mock('@/db/database', () => ({ getDb: jest.fn() }))
jest.mock('@/lib/photo-files', () => ({ deletePhotoFiles: jest.fn() }))

const now = new Date('2026-10-26T15:00:00.000Z')
const iso = now.toISOString()

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  return db
}

async function draftWithNote(db: Db): Promise<Draft> {
  const { draft } = await openDraft(db, { id: 'i-1', hiveId: 'h-1', organizationId: 'o', now: iso })
  const fields = { ...draft.fields, population_strength: 4 }
  const notes = [{ id: 'n-1', slot: 1, text: 'Falta una alza', source: 'text' as const, at: iso }]
  await updateDraft(db, draft.id, fields, notes)
  return { ...draft, fields, notes, events: [] }
}

const count = async (db: Db, sql: string) => (await db.getFirstAsync<{ n: number }>(sql))?.n

describe('finishDraft', () => {
  it('saves the inspection, its note and their outbox entries, and drops the draft', async () => {
    const db = await database()
    const outcome = await finishDraft(db, await draftWithNote(db), 'u-1', now)
    expect(outcome.ok).toBe(true)
    expect(await count(db, 'select count(*) as n from inspections where deleted_at is null')).toBe(
      1,
    )
    expect(await count(db, "select count(*) as n from hive_events where type = 'note'")).toBe(1)
    expect(await count(db, 'select count(*) as n from outbox')).toBe(2)
    expect(await findNewDraft(db, 'h-1')).toBeNull()
  })

  it('refuses an incoherent draft and keeps it', async () => {
    const db = await database()
    const draft = await draftWithNote(db)
    const outcome = await finishDraft(
      db,
      { ...draft, fields: { ...draft.fields, varroa_count: 3 } },
      'u-1',
      now,
    )
    expect(outcome).toEqual({
      ok: false,
      problems: { varroa_method: 'Elige cómo contaste la varroa.' },
    })
    expect(await findNewDraft(db, 'h-1')).not.toBeNull()
  })

  it('undoes an unsent inspection completely and brings the draft back', async () => {
    const db = await database()
    const outcome = await finishDraft(db, await draftWithNote(db), 'u-1', now)
    if (!outcome.ok) throw new Error('not saved')
    await undoFinish(db, outcome.finished)
    expect(await count(db, 'select count(*) as n from inspections')).toBe(0)
    expect(await count(db, 'select count(*) as n from hive_events')).toBe(0)
    expect(await count(db, 'select count(*) as n from outbox')).toBe(0)
    expect((await findNewDraft(db, 'h-1'))?.fields.population_strength).toBe(4)
  })

  it('soft-deletes a pushed inspection on undo, and finishing again restores it and its note', async () => {
    const db = await database()
    const draft = await draftWithNote(db)
    const outcome = await finishDraft(db, draft, 'u-1', now)
    if (!outcome.ok) throw new Error('not saved')
    await db.runAsync('delete from outbox')
    await db.runAsync('update inspections set _on_server = 1, _dirty = 0')
    await db.runAsync('update hive_events set _on_server = 1, _dirty = 0')

    await undoFinish(db, outcome.finished)
    expect(
      await count(db, 'select count(*) as n from inspections where deleted_at is not null'),
    ).toBe(1)
    expect(
      await count(db, 'select count(*) as n from hive_events where deleted_at is not null'),
    ).toBe(1)

    const again = await findNewDraft(db, 'h-1')
    if (!again) throw new Error('draft not restored')
    expect((await finishDraft(db, again, 'u-1', now)).ok).toBe(true)
    expect(await count(db, 'select count(*) as n from inspections where deleted_at is null')).toBe(
      1,
    )
    expect(await count(db, 'select count(*) as n from hive_events where deleted_at is null')).toBe(
      1,
    )
  })

  it('edits keep note ids and soft-delete a removed note', async () => {
    const db = await database()
    const first = await finishDraft(db, await draftWithNote(db), 'u-1', now)
    expect(first.ok).toBe(true)
    const edit = await openEditDraft(db, 'i-1', iso)
    if (!edit) throw new Error('no edit draft')
    expect(edit.draft.notes.map((n) => n.id)).toEqual(['n-1'])
    const outcome = await finishDraft(
      db,
      { ...edit.draft, fields: { ...edit.draft.fields, population_strength: 2 }, notes: [] },
      'u-2',
      now,
    )
    expect(outcome.ok).toBe(true)
    expect(
      await db.getFirstAsync('select population_strength, inspected_by from inspections'),
    ).toEqual({
      population_strength: 2,
      inspected_by: 'u-1',
    })
    expect(
      await count(
        db,
        "select count(*) as n from hive_events where id = 'n-1' and deleted_at is not null",
      ),
    ).toBe(1)
  })

  it('undoing an edit removes the notes the edit added', async () => {
    const db = await database()
    expect((await finishDraft(db, await draftWithNote(db), 'u-1', now)).ok).toBe(true)
    const edit = await openEditDraft(db, 'i-1', iso)
    if (!edit) throw new Error('no edit draft')
    const added = { id: 'n-3', slot: 3, text: 'Nueva', source: 'text' as const, at: iso }
    const outcome = await finishDraft(
      db,
      { ...edit.draft, notes: [...edit.draft.notes, added] },
      'u-1',
      now,
    )
    if (!outcome.ok) throw new Error('not saved')
    await undoFinish(db, outcome.finished)
    expect(await count(db, "select count(*) as n from hive_events where id = 'n-3'")).toBe(0)
    expect(
      await count(
        db,
        "select count(*) as n from hive_events where id = 'n-1' and deleted_at is null",
      ),
    ).toBe(1)
  })

  it('refuses to save an edit of an inspection deleted meanwhile', async () => {
    const db = await database()
    expect((await finishDraft(db, await draftWithNote(db), 'u-1', now)).ok).toBe(true)
    const edit = await openEditDraft(db, 'i-1', iso)
    if (!edit) throw new Error('no edit draft')
    await db.runAsync("update inspections set deleted_at = '2026-10-26T16:00:00.000Z'")
    expect((await finishDraft(db, edit.draft, 'u-1', now)).ok).toBe(false)
  })

  it('writes a dictated feeding with the inspection, and undo takes it away', async () => {
    const db = await database()
    const draft = await draftWithNote(db)
    const feeding = {
      id: 'f-1',
      type: 'feeding',
      details: { feed: 'sugar_syrup', amount: 2, unit: 'l' },
      at: iso,
    }
    const outcome = await finishDraft(db, { ...draft, events: [feeding] }, 'u-1', now)
    if (!outcome.ok) throw new Error('not saved')
    expect(
      await db.getFirstAsync("select type, inspection_id from hive_events where id = 'f-1'"),
    ).toEqual({ type: 'feeding', inspection_id: 'i-1' })
    await undoFinish(db, outcome.finished)
    expect(await count(db, "select count(*) as n from hive_events where id = 'f-1'")).toBe(0)
    expect((await findNewDraft(db, 'h-1'))?.events).toEqual([feeding])
  })

  it("applies an owner's event effect on the hive at Terminar, and undo puts the hive back", async () => {
    const db = await database()
    await db.runAsync(
      "insert into hives (id, organization_id, apiary_id, name, qr_code, queen_year, _on_server) values ('h-1', 'o', 'a', 'C-01', 'X', 2024, 1)",
    )
    const draft = await draftWithNote(db)
    const queen = {
      id: 'q-1',
      type: 'queen_change',
      details: { queen_year: 2026 },
      at: iso,
      hivePatches: [{ hiveId: 'h-1', patch: { queen_year: 2026 } }],
    }
    const outcome = await finishDraft(db, { ...draft, events: [queen] }, 'u-1', now)
    if (!outcome.ok) throw new Error('not saved')
    expect(await db.getFirstAsync('select queen_year from hives')).toEqual({ queen_year: 2026 })
    await undoFinish(db, outcome.finished)
    expect(await db.getFirstAsync('select queen_year from hives')).toEqual({ queen_year: 2024 })
  })
})
