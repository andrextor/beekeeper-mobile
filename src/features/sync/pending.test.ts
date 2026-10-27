import { entryDetail, type PendingEntry } from './pending'

jest.mock('@/db/database', () => ({ getDb: jest.fn() }))
jest.mock('@/db/useLocalQuery', () => ({ useLocalQuery: jest.fn() }))

const now = new Date('2026-10-26T12:00:00Z')
const entry = (attempts: number, dueInMs: number): PendingEntry => ({
  id: 'o1',
  table_name: 'apiaries',
  row_id: 'a1',
  payload: '{}',
  attempts,
  next_attempt_at: new Date(now.getTime() + dueInMs).toISOString(),
  last_error: null,
  last_error_code: null,
  state: 'pending',
  hive_name: null,
})

describe('entryDetail', () => {
  it('says the entry is queued before any attempt', () => {
    expect(entryDetail(entry(0, 0), now)).toBe('En cola')
  })

  it('bounds a due or past retry by one foreground tick', () => {
    expect(entryDetail(entry(1, 5_000), now)).toBe('Intento 1 · se reintenta en menos de 3 minutos')
    expect(entryDetail(entry(2, -30_000), now)).toBe(
      'Intento 2 · se reintenta en menos de 2 minutos',
    )
  })

  it('adds the tick to a long backoff', () => {
    expect(entryDetail(entry(4, 600_000), now)).toBe(
      'Intento 4 · se reintenta en menos de 12 minutos',
    )
  })
})
