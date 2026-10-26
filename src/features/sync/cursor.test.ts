import type { Db } from '@/db/db'
import type { ServerRow } from '@/db/mapping'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { saveRow } from '@/db/write'
import type { Membership } from './members'
import {
  type After,
  epoch,
  type PullTable,
  pageSize,
  pull,
  type Row,
  type Source,
  withOverlap,
} from './pull'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))

const finca = (id: string): Membership => ({
  organization_id: id,
  organization_name: `Finca ${id}`,
  role: 'owner',
})

const apiary = (id: string, organizationId: string, updatedAt: string): ServerRow<'apiaries'> => ({
  id,
  organization_id: organizationId,
  name: id,
  farm_name: null,
  place: null,
  latitude: null,
  longitude: null,
  altitude_m: null,
  flora_notes: null,
  water_source: null,
  notes: null,
  created_by: 'user-1',
  created_at: updatedAt,
  updated_at: updatedAt,
  deleted_at: null,
})

type Call = { table: PullTable; organizationId: string; after: After }

/** Serves `rows` per finca and table; `memberships` can change between runs. */
function fakeSource(memberships: Membership[], rows: Record<string, Row[]> = {}) {
  const calls: Call[] = []
  const source: Source & { calls: Call[]; memberships: () => Promise<Membership[]> } = {
    calls,
    memberships: async () => memberships,
    page: async (table, organizationId, after) => {
      calls.push({ table, organizationId, after })
      return (rows[`${organizationId}/${table}`] ?? []).filter(
        (r) => String(r.updated_at) > after.at,
      )
    },
  }
  return source
}

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  return db
}

const cursorOf = (db: Db, organizationId: string, table: string) =>
  db.getFirstAsync<{ cursor: string; initial_pull_done: number }>(
    'select cursor, initial_pull_done from sync_state where organization_id = ? and table_name = ?',
    [organizationId, table],
  )

describe('pull cursors', () => {
  it('keeps the last row minus 2 minutes and marks the first pull done', async () => {
    const db = await database()
    const source = fakeSource([finca('a')], {
      'a/apiaries': [
        apiary('x', 'a', '2026-10-26T10:00:00.000Z'),
        apiary('y', 'a', '2026-10-26T10:05:00.123456+00:00'),
      ],
    })
    await pull(db, source)
    expect(await cursorOf(db, 'a', 'apiaries')).toEqual({
      cursor: '2026-10-26T10:03:00.123Z',
      initial_pull_done: 1,
    })
    expect(await db.getAllAsync('select id, _on_server from apiaries order by id')).toEqual([
      { id: 'x', _on_server: 1 },
      { id: 'y', _on_server: 1 },
    ])
  })

  it('never lets a pulled row overwrite a local edit not yet pushed', async () => {
    const db = await database()
    await saveRow(db, 'apiaries', {
      ...apiary('x', 'a', '2026-10-26T09:00:00.000Z'),
      name: 'Editado aquí',
    })
    await pull(
      db,
      fakeSource([finca('a')], { 'a/apiaries': [apiary('x', 'a', '2026-10-26T10:00:00.000Z')] }),
    )
    expect(await db.getFirstAsync('select name, _dirty, _on_server from apiaries')).toEqual({
      name: 'Editado aquí',
      _dirty: 1,
      _on_server: 1,
    })
  })

  it('stops after 40 full pages and continues on the next run', async () => {
    const db = await database()
    const source = fakeSource([finca('a')])
    let n = 0
    const full = source.page
    source.page = async (table, organizationId, after) => {
      if (table !== 'apiaries') return full(table, organizationId, after)
      source.calls.push({ table, organizationId, after })
      return Array.from({ length: pageSize }, () => {
        n += 1
        return apiary(
          `r${String(n).padStart(6, '0')}`,
          'a',
          new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
        )
      })
    }
    await pull(db, source)
    expect(source.calls.filter((c) => c.table === 'apiaries')).toHaveLength(40)
    expect((await cursorOf(db, 'a', 'apiaries'))?.initial_pull_done).toBe(0)
    const later = source.calls.filter((c) => c.table === 'apiaries')[1]
    expect(later?.after.id).toBe('r000500')
  })

  it('starts a newly joined finca at 1970 while the others keep their cursor', async () => {
    const db = await database()
    const rows = { 'a/apiaries': [apiary('x', 'a', '2026-10-26T10:00:00.000Z')] }
    await pull(db, fakeSource([finca('a')], rows))
    const second = fakeSource([finca('a'), finca('b')], rows)
    await pull(db, second)
    const first = (organizationId: string, table: PullTable) =>
      second.calls.find((c) => c.organizationId === organizationId && c.table === table)?.after.at
    expect(first('a', 'apiaries')).toBe('2026-10-26T09:58:00.000Z')
    expect(first('b', 'apiaries')).toBe(epoch)
    expect(first('', 'profiles')).toBe(epoch)
  })

  it('purges a lost finca but keeps its unsent changes for the person to decide', async () => {
    const db = await database()
    const rows = {
      'a/apiaries': [apiary('kept', 'a', '2026-10-26T10:00:00.000Z')],
      'b/apiaries': [apiary('gone', 'b', '2026-10-26T10:00:00.000Z')],
    }
    await pull(db, fakeSource([finca('a'), finca('b')], rows))
    await saveRow(db, 'apiaries', apiary('unsent', 'b', '2026-10-26T11:00:00.000Z'))
    await db.runAsync("insert into profiles_cache values ('p', 'p@x.co', null, null, '2026-10-26')")

    await pull(db, fakeSource([finca('a')], rows))

    expect(await db.getAllAsync('select id from apiaries order by id')).toEqual([
      { id: 'kept' },
      { id: 'unsent' },
    ])
    expect(await db.getFirstAsync('select state, last_error from outbox')).toEqual({
      state: 'failed_permanent',
      last_error: 'Ya no tienes acceso a esta finca.',
    })
    expect(await cursorOf(db, 'b', 'apiaries')).toBeNull()
    expect(await db.getAllAsync('select id from profiles_cache')).toEqual([])
  })
})

describe('withOverlap', () => {
  it('reads any fraction as milliseconds and falls back to the same cursor on a bad date', () => {
    expect(withOverlap('2026-10-26T10:05:00.123456+00:00')).toBe('2026-10-26T10:03:00.123Z')
    expect(withOverlap('2026-10-26T10:05:00.1+00:00')).toBe('2026-10-26T10:03:00.100Z')
    expect(withOverlap('2026-10-26T10:05:00+00:00')).toBe('2026-10-26T10:03:00.000Z')
    expect(withOverlap('not a date')).toBe('not a date')
  })
})
