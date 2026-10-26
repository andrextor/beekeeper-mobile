import type { ServerRow } from '@/db/mapping'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { saveRow } from '@/db/write'
import { replaceTakenQrCode } from './qr-taken'

jest.mock('expo-crypto', () => ({ randomUUID: () => 'event-1' }))

const now = '2026-10-26T10:00:00.000Z'

const hive: ServerRow<'hives'> = {
  id: 'h-1',
  organization_id: 'org-1',
  apiary_id: 'a-1',
  name: 'C-04',
  qr_code: 'AAAAAAAAAA',
  hive_type: null,
  brood_boxes: null,
  supers: null,
  colony_origin: null,
  colony_started_on: null,
  bee_race: null,
  queen_year: null,
  queen_marked: null,
  queen_color: null,
  queen_origin: null,
  status: 'active',
  notes: null,
  created_by: 'user-1',
  created_at: now,
  updated_at: now,
  deleted_at: null,
}

describe('replaceTakenQrCode', () => {
  it('re-queues the hive with a new code and records the relabel', async () => {
    const db = openTestDb()
    await migrate(db)
    await saveRow(db, 'hives', hive)
    await db.runAsync("update outbox set state = 'failed_permanent', attempts = 1")

    expect(await replaceTakenQrCode(db, 'h-1', 'BBBBBBBBBB')).toBe(true)

    expect(await db.getFirstAsync('select qr_code from hives')).toEqual({ qr_code: 'BBBBBBBBBB' })
    const entries = await db.getAllAsync<{ table_name: string; state: string; payload: string }>(
      'select table_name, state, payload from outbox order by table_name',
    )
    expect(entries.map((e) => [e.table_name, e.state])).toEqual([
      ['hive_events', 'pending'],
      ['hives', 'pending'],
    ])
    expect(JSON.parse(entries[0]?.payload ?? '{}')).toMatchObject({
      type: 'qr_relabel',
      details: { old_qr_code: 'AAAAAAAAAA', new_qr_code: 'BBBBBBBBBB' },
    })
  })

  it('gives up after three relabels', async () => {
    const db = openTestDb()
    await migrate(db)
    await saveRow(db, 'hives', hive)
    for (const n of [1, 2, 3]) {
      await db.runAsync(
        "insert into hive_events (id, organization_id, hive_id, type, occurred_at) values (?, 'org-1', 'h-1', 'qr_relabel', '2026-10-26')",
        [`e-${n}`],
      )
    }
    expect(await replaceTakenQrCode(db, 'h-1', 'CCCCCCCCCC')).toBe(false)
  })
})
