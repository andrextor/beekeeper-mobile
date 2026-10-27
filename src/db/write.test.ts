import type { Db } from './db'
import type { ServerRow } from './mapping'
import { migrate } from './migrate'
import { openTestDb } from './test-db'
import { saveRow } from './write'

const meta = {
  organization_id: 'org-1',
  created_by: 'user-1',
  created_at: '2026-10-25T09:00:00.000Z',
  updated_at: '2026-10-25T09:00:00.000Z',
  deleted_at: null,
}

const inspection: ServerRow<'inspections'> = {
  ...meta,
  id: 'i-1',
  hive_id: 'h-1',
  inspected_at: '2026-10-25T09:00:00.000Z',
  inspected_by: 'user-1',
  source: 'manual',
  transcript: null,
  population_strength: null,
  temperament: null,
  queen_seen: null,
  eggs_seen: null,
  larvae_seen: null,
  queen_cells: null,
  brood_frames: null,
  honey_frames: null,
  pollen_frames: null,
  brood_pattern: null,
  stores: null,
  varroa_method: null,
  varroa_count: null,
  varroa_sample_size: null,
  pests: null,
  disease_signs: null,
  weather: null,
  temperature_c: null,
  attention_level: null,
  planned_actions: null,
  next_inspection_on: null,
  notes: null,
}

const note = (id: string, inspectionId: string): ServerRow<'hive_events'> => ({
  ...meta,
  id,
  hive_id: 'h-1',
  inspection_id: inspectionId,
  type: 'note',
  occurred_at: '2026-10-25T09:01:00.000Z',
  details: { text: 'tranquila', source: 'text' },
})

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  return db
}

const outbox = (db: Db) =>
  db.getAllAsync<{ row_id: string; payload: string; attempts: number; state: string }>(
    'select row_id, payload, attempts, state from outbox order by row_id',
  )

const member = (db: Db, role: string) =>
  db.runAsync(
    "insert into members_cache (organization_id, organization_name, role) values ('org-1', 'Finca', ?)",
    [role],
  )

describe('saveRow', () => {
  it('refuses an observador and writes nothing', async () => {
    const db = await database()
    await member(db, 'viewer')
    await expect(saveRow(db, 'inspections', inspection)).rejects.toMatchObject({ code: '42501' })
    expect(await db.getAllAsync('select id from inspections')).toEqual([])
    expect(await outbox(db)).toEqual([])
  })

  it('saves a reviewer as before', async () => {
    const db = await database()
    await member(db, 'reviewer')
    await saveRow(db, 'inspections', inspection)
    expect(await outbox(db)).toHaveLength(1)
  })

  it('writes the row dirty with one outbox entry', async () => {
    const db = await database()
    await saveRow(db, 'inspections', inspection)
    expect(await db.getFirstAsync('select _dirty, _on_server from inspections')).toEqual({
      _dirty: 1,
      _on_server: 0,
    })
    expect(await outbox(db)).toHaveLength(1)
  })

  it('coalesces a second edit into the same entry, ready to push again', async () => {
    const db = await database()
    await saveRow(db, 'inspections', inspection)
    await db.runAsync("update outbox set attempts = 3, state = 'failed_permanent'")
    await saveRow(db, 'inspections', { ...inspection, notes: 'segunda' })
    const [entry, ...rest] = await outbox(db)
    expect(rest).toEqual([])
    expect(entry).toMatchObject({ attempts: 0, state: 'pending' })
    expect(JSON.parse(entry?.payload ?? '{}')).toMatchObject({ notes: 'segunda' })
  })

  it('soft-deleting an inspection soft-deletes its events, not other ones', async () => {
    const db = await database()
    await saveRow(db, 'inspections', inspection)
    await saveRow(db, 'hive_events', note('e-1', 'i-1'))
    await saveRow(db, 'hive_events', note('e-2', 'i-2'))
    const deletedAt = '2026-10-26T08:00:00.000Z'
    await saveRow(db, 'inspections', { ...inspection, deleted_at: deletedAt })
    expect(await db.getAllAsync('select id, deleted_at from hive_events order by id')).toEqual([
      { id: 'e-1', deleted_at: deletedAt },
      { id: 'e-2', deleted_at: null },
    ])
    const e1 = (await outbox(db)).find((e) => e.row_id === 'e-1')
    expect(JSON.parse(e1?.payload ?? '{}')).toMatchObject({ deleted_at: deletedAt })
  })
})
