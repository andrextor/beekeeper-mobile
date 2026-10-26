import { createHash } from 'node:crypto'

import { migrate } from './migrate'
import { migrations } from './migrations'
import { openTestDb } from './test-db'

// One hash per released step. Add a line for a new step; never change or remove one.
const released = [
  '19624680adc7fa65',
  '89f1de37293cb6e9',
  '21c9498d604f6974',
  'd6c752c1455b2b3d',
  '3eba8af59a56ca84',
]

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
      'settings',
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

  it('keeps unsent rows and an open draft through every step from version 1', async () => {
    const db = openTestDb()
    await migrate(db, migrations.slice(0, 1))
    await db.execAsync(`
      insert into apiaries (id, organization_id, name) values ('a', 'o', 'La Loma');
      insert into hives (id, organization_id, apiary_id, name, qr_code) values ('h', 'o', 'a', 'C-01', 'K7M29QXA');
      insert into inspections (id, organization_id, hive_id, inspected_at, source)
        values ('i', 'o', 'h', '2026-10-20T10:00:00.000Z', 'manual');
      insert into outbox (id, table_name, row_id, payload, created_at, next_attempt_at) values
        ('1', 'apiaries', 'a', '{"organization_id":"o"}', '2026-10-20', '2026-10-20'),
        ('2', 'hives', 'h', '{"organization_id":"o"}', '2026-10-20', '2026-10-20'),
        ('3', 'inspections', 'i', '{"organization_id":"o"}', '2026-10-20', '2026-10-20');
    `)
    await migrate(db, migrations.slice(0, 2))
    await db.runAsync(
      `insert into inspection_drafts (id, organization_id, hive_id, payload, notes, created_at, updated_at)
       values ('d', 'o', 'h', '{"queen_seen":true}', '[]', '2026-10-20', '2026-10-20')`,
    )

    for (let step = 3; step <= migrations.length; step++) {
      await migrate(db, migrations.slice(0, step))
    }

    expect(await db.getFirstAsync('pragma user_version')).toEqual({
      user_version: migrations.length,
    })
    expect(await db.getAllAsync('select id, name from apiaries')).toEqual([
      { id: 'a', name: 'La Loma' },
    ])
    expect(await db.getAllAsync('select id, qr_code from hives')).toEqual([
      { id: 'h', qr_code: 'K7M29QXA' },
    ])
    expect(await db.getAllAsync('select id, inspected_at from inspections')).toEqual([
      { id: 'i', inspected_at: '2026-10-20T10:00:00.000Z' },
    ])
    expect(await db.getAllAsync('select id, state from outbox order by id')).toEqual([
      { id: '1', state: 'pending' },
      { id: '2', state: 'pending' },
      { id: '3', state: 'pending' },
    ])
    expect(await db.getAllAsync('select id, payload from inspection_drafts')).toEqual([
      { id: 'd', payload: '{"queen_seen":true}' },
    ])
  })
})
