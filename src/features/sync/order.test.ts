import type { SyncedTable } from '@/db/mapping'
import { type OutboxEntry, pushSteps } from './order'

let clock = 0

function entry(
  table_name: SyncedTable,
  row_id: string,
  { deleted = false, onServer = true }: { deleted?: boolean; onServer?: boolean } = {},
): OutboxEntry {
  clock += 1
  return {
    id: `${table_name}:${row_id}`,
    table_name,
    row_id,
    payload: JSON.stringify({ id: row_id, deleted_at: deleted ? '2026-10-26T08:00:00Z' : null }),
    attempts: 0,
    created_at: `2026-10-26T08:00:${String(clock).padStart(2, '0')}Z`,
    on_server: onServer ? 1 : 0,
  }
}

const plan = (entries: OutboxEntry[]) =>
  pushSteps(entries).map(
    (s) =>
      `${s.final ? '' : 'first '}${s.payload.deleted_at ? 'delete' : 'live'} ${s.entry.row_id}`,
  )

describe('pushSteps', () => {
  it('pushes live rows parent-first whatever the order they were saved in', () => {
    expect(plan([entry('inspections', 'i'), entry('hives', 'h'), entry('apiaries', 'a')])).toEqual([
      'live a',
      'live h',
      'live i',
    ])
  })

  it('uploads a pending inspection before deleting its hive', () => {
    expect(
      plan([
        entry('inspections', 'i', { onServer: false }),
        entry('hives', 'h', { deleted: true }),
      ]),
    ).toEqual(['live i', 'delete h'])
  })

  it('creates a hive made and deleted offline before its inspection, then deletes it', () => {
    expect(
      plan([
        entry('hives', 'h', { deleted: true, onServer: false }),
        entry('inspections', 'i', { onServer: false }),
      ]),
    ).toEqual(['first live h', 'live i', 'delete h'])
  })

  it('deletes hives before their apiary', () => {
    expect(
      plan([
        entry('apiaries', 'a', { deleted: true }),
        entry('hives', 'h1', { deleted: true }),
        entry('hives', 'h2', { deleted: true }),
      ]),
    ).toEqual(['delete h1', 'delete h2', 'delete a'])
  })
})
