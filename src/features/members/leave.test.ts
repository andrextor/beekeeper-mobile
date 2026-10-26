import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { pendingForFinca } from './leave'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))
jest.mock('@/features/sync/triggers', () => ({ syncNow: jest.fn() }))

describe('pendingForFinca', () => {
  it('counts only the outbox entries of that finca', async () => {
    const db = openTestDb()
    await migrate(db)
    const entry = (id: string, organizationId: string) =>
      db.runAsync(
        `insert into outbox (id, table_name, row_id, payload, created_at, next_attempt_at)
         values (?, 'apiaries', ?, ?, '2026-10-26', '2026-10-26')`,
        [id, id, JSON.stringify({ organization_id: organizationId })],
      )
    await entry('1', 'a')
    await entry('2', 'a')
    await entry('3', 'b')
    expect(await pendingForFinca(db, 'a')).toBe(2)
    expect(await pendingForFinca(db, 'c')).toBe(0)
  })
})
