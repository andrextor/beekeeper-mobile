import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { type Draft, findNewDraft, openDraft, openEditDraft, updateDraft } from './drafts'
import { finishDraft, undoFinish } from './finish'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))
jest.mock('@/db/database', () => ({ getDb: jest.fn() }))

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
  return { ...draft, fields, notes }
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
})
