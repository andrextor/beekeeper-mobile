import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { hivesToVisit, type LatestInspection, latestInspections, openTasks } from './home'

const today = '2026-10-26'

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  const hives: [string, string, string | null][] = [
    ['h-1', 'active', null],
    ['h-dead', 'dead', null],
    ['h-gone', 'active', '2026-10-01T00:00:00.000Z'],
  ]
  for (const [id, status, deleted] of hives) {
    await db.runAsync(
      "insert into hives (id, organization_id, apiary_id, name, qr_code, status, deleted_at) values (?, 'o', 'a', ?, 'X', ?, ?)",
      [id, id, status, deleted],
    )
  }
  return db
}

const inspect = (
  db: Db,
  id: string,
  hiveId: string,
  at: string,
  actions: string[] | null,
  deleted = false,
) =>
  db.runAsync(
    "insert into inspections (id, organization_id, hive_id, inspected_at, source, planned_actions, deleted_at) values (?, 'o', ?, ?, 'manual', ?, ?)",
    [id, hiveId, at, actions ? JSON.stringify(actions) : null, deleted ? at : null],
  )

const row = (hive: string, fields: Partial<LatestInspection>): LatestInspection => ({
  hive_id: hive,
  hive_name: hive,
  apiary_name: null,
  attention_level: null,
  next_inspection_on: null,
  planned_actions: null,
  ...fields,
})

describe('latestInspections', () => {
  it('takes only the latest live inspection, ties by highest id, of live active hives', async () => {
    const db = await database()
    await inspect(db, 'i-old', 'h-1', '2026-10-01T10:00:00.000Z', ['treat'])
    await inspect(db, 'i-a', 'h-1', '2026-10-20T10:00:00.000Z', ['harvest'])
    await inspect(db, 'i-b', 'h-1', '2026-10-20T10:00:00.000Z', ['feed'])
    await inspect(db, 'i-deleted', 'h-1', '2026-10-25T10:00:00.000Z', ['split'], true)
    await inspect(db, 'i-dead', 'h-dead', '2026-10-25T10:00:00.000Z', ['feed'])
    await inspect(db, 'i-gone', 'h-gone', '2026-10-25T10:00:00.000Z', ['feed'])
    expect(await latestInspections(db, 'o')).toEqual([
      expect.objectContaining({ hive_id: 'h-1', planned_actions: ['feed'] }),
    ])
  })
})

describe('hivesToVisit', () => {
  it('lists urgent first, then the most overdue, due today, then soon', () => {
    const visits = hivesToVisit(
      [
        row('soon', { attention_level: 'soon' }),
        row('late-1', { next_inspection_on: '2026-10-25' }),
        row('today', { next_inspection_on: today }),
        row('urgent', { attention_level: 'urgent' }),
        row('late-5', { next_inspection_on: '2026-10-21' }),
        row('later', { next_inspection_on: '2026-11-02', attention_level: 'none' }),
      ],
      today,
    )
    expect(visits.map((v) => [v.hiveName, v.reason])).toEqual([
      ['urgent', 'Urgente'],
      ['late-5', 'Revisión atrasada 5 días'],
      ['late-1', 'Revisión atrasada 1 día'],
      ['today', 'Revisión para hoy'],
      ['soon', 'Pidió volver pronto'],
    ])
  })
})

describe('openTasks', () => {
  it('groups planned actions by action, the biggest group first', () => {
    const tasks = openTasks([
      row('C-01', { planned_actions: ['feed', 'treat'] }),
      row('C-02', { planned_actions: ['feed'] }),
    ])
    expect(tasks.map((t) => [t.label, t.hives.map((h) => h.name)])).toEqual([
      ['Alimentar', ['C-01', 'C-02']],
      ['Tratar', ['C-01']],
    ])
  })
})
