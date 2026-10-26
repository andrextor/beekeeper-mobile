import { createHash } from 'node:crypto'

import { migrate } from './migrate'
import { migrations } from './migrations'
import { openTestDb } from './test-db'

// One hash per released step. Add a line for a new step; never change or remove one.
const released = ['19624680adc7fa65', '89f1de37293cb6e9', '21c9498d604f6974']

const hash = (sql: string) => createHash('sha256').update(sql).digest('hex').slice(0, 16)

describe('local migrations', () => {
  it('never edits or removes a released step', () => {
    expect(migrations.slice(0, released.length).map(hash)).toEqual(released)
  })

  it('builds every table on an empty database and records the version', async () => {
    const db = openTestDb()
    await migrate(db)
    const tables = await db.getAllAsync<{ name: string }>(
      "select name from sqlite_master where type = 'table' order by name",
    )
    expect(tables.map((t) => t.name)).toEqual([
      'apiaries',
      'hive_events',
      'hives',
      'inspection_drafts',
      'inspections',
      'members_cache',
      'outbox',
      'photos',
      'profiles_cache',
      'sync_state',
    ])
    expect(await db.getFirstAsync('pragma user_version')).toEqual({
      user_version: migrations.length,
    })
  })

  it('runs only the new steps on a database that has the old ones', async () => {
    const db = openTestDb()
    await migrate(db, migrations)
    await migrate(db, [...migrations, 'create table later (id text)'])
    await migrate(db, [...migrations, 'create table later (id text)'])
    expect(await db.getFirstAsync('pragma user_version')).toEqual({
      user_version: migrations.length + 1,
    })
  })

  it('rewrites timestamps pulled before 0.6.0 to the one text format', async () => {
    const db = openTestDb()
    await migrate(db, migrations.slice(0, 2))
    await db.runAsync(
      "insert into inspections (id, organization_id, hive_id, inspected_at, source, deleted_at) values ('i', 'o', 'h', '2026-10-20T10:00:00.123456+00:00', 'manual', '2026-10-21T10:00:00+00:00')",
    )
    await migrate(db)
    expect(
      await db.getFirstAsync('select inspected_at, deleted_at, created_at from inspections'),
    ).toEqual({
      inspected_at: '2026-10-20T10:00:00.123Z',
      deleted_at: '2026-10-21T10:00:00.000Z',
      created_at: null,
    })
  })
})
