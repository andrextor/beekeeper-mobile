import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { findNewDraft, nextSlot, openDraft, openEditDraft, updateDraft } from './drafts'

const now = '2026-10-26T09:40:00.000Z'

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  return db
}

describe('drafts', () => {
  it('keeps one new draft per hive and resumes it with the same id and fields', async () => {
    const db = await database()
    const first = await openDraft(db, { id: 'd-1', hiveId: 'h-1', organizationId: 'o', now })
    expect(first.resumed).toBe(false)
    await updateDraft(db, 'd-1', { ...first.draft.fields, population_strength: 4 }, [])
    const again = await openDraft(db, { id: 'd-2', hiveId: 'h-1', organizationId: 'o', now })
    expect(again).toMatchObject({
      resumed: true,
      draft: { id: 'd-1', fields: { population_strength: 4 } },
    })
    expect((await findNewDraft(db, 'h-1'))?.fields.inspected_at).toBe(now)
  })

  it('opens an edit draft beside the new one, copying the saved row and its notes', async () => {
    const db = await database()
    await openDraft(db, { id: 'd-1', hiveId: 'h-1', organizationId: 'o', now })
    await db.runAsync(
      "insert into inspections (id, organization_id, hive_id, inspected_at, source, population_strength) values ('i-1', 'o', 'h-1', '2026-10-20T10:00:00.000Z', 'manual', 3)",
    )
    await db.runAsync(
      `insert into hive_events (id, organization_id, hive_id, inspection_id, type, occurred_at, details)
       values ('n-1', 'o', 'h-1', 'i-1', 'note', '2026-10-20T10:05:00.000Z', '{"text":"Falta una alza","source":"text","slot":1}')`,
    )
    const edit = await openEditDraft(db, 'i-1', now)
    expect(edit?.draft).toMatchObject({
      id: 'i-1',
      is_edit: true,
      fields: { population_strength: 3, inspected_at: '2026-10-20T10:00:00.000Z' },
      notes: [{ id: 'n-1', slot: 1, text: 'Falta una alza', source: 'text' }],
    })
    expect((await openEditDraft(db, 'i-1', now))?.resumed).toBe(true)
    expect(await openEditDraft(db, 'missing', now)).toBeNull()
  })

  it('gives "Nota +" the first free slot from 3', () => {
    const note = (slot: number) => ({
      id: `n${slot}`,
      slot,
      text: 'x',
      source: 'text' as const,
      at: now,
    })
    expect(nextSlot([note(1)])).toBe(3)
    expect(nextSlot([note(1), note(3), note(4)])).toBe(5)
  })
})
