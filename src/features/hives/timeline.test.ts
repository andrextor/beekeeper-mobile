import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { localTimeline } from './timeline'

const at = (minute: number) => `2026-10-26T10:${String(minute).padStart(2, '0')}:00.000Z`

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  await db.runAsync(
    "insert into profiles_cache values ('u-1', 'ana@landak.test', 'Ana', null, '2026-10-26')",
  )
  return db
}

const inspection = (db: Db, id: string, minute: number, hiveId = 'h-1') =>
  db.runAsync(
    "insert into inspections (id, organization_id, hive_id, inspected_at, source, created_by) values (?, 'o', ?, ?, 'manual', 'u-1')",
    [id, hiveId, at(minute)],
  )

const event = (
  db: Db,
  id: string,
  minute: number,
  type = 'feeding',
  inspectionId: string | null = null,
) =>
  db.runAsync(
    "insert into hive_events (id, organization_id, hive_id, inspection_id, type, occurred_at, created_by) values (?, 'o', 'h-1', ?, ?, ?, 'u-2')",
    [id, inspectionId, type, at(minute)],
  )

describe('localTimeline', () => {
  it('merges newest first, ties by id, and never repeats or drops an item as the limit grows', async () => {
    const db = await database()
    await inspection(db, 'i-a', 30)
    await event(db, 'e-b', 30)
    await event(db, 'e-old', 10)
    await inspection(db, 'i-other-hive', 40, 'h-2')

    const ids = async (limit: number) => (await localTimeline(db, 'h-1', limit)).map((i) => i.id)
    expect(await ids(1)).toEqual(['i-a'])
    expect(await ids(2)).toEqual(['i-a', 'e-b'])
    expect(await ids(30)).toEqual(['i-a', 'e-b', 'e-old'])
  })

  it('puts the notes of an inspection inside it and names the authors it knows', async () => {
    const db = await database()
    await inspection(db, 'i-1', 20)
    await event(db, 'n-1', 21, 'note', 'i-1')
    await event(db, 'n-loose', 5, 'note')
    const [first, second] = await localTimeline(db, 'h-1', 30)
    expect(first?.kind === 'inspection' && first.notes.map((n) => n.id)).toEqual(['n-1'])
    expect(first?.author).toBe('Ana')
    expect(second).toMatchObject({ id: 'n-loose', author: null })
  })

  it('marks items still in the outbox', async () => {
    const db = await database()
    await inspection(db, 'i-1', 20)
    await db.runAsync(
      "insert into outbox (id, table_name, row_id, payload, next_attempt_at, created_at, state) values ('x', 'inspections', 'i-1', '{}', '', '', 'failed_permanent')",
    )
    expect((await localTimeline(db, 'h-1', 30))[0]?.sync).toBe('attention')
  })
})
