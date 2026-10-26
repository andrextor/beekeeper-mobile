import { type Candidate, chooseEvictions } from './evict'

jest.mock('@/lib/photo-files', () => ({}))
jest.mock('@/features/sync/triggers', () => ({ onFullSync: jest.fn() }))

const now = new Date('2026-10-26T12:00:00.000Z')
const mb = 1024 * 1024
const photo = (id: string, seen: string, bytes = 0.25 * mb): Candidate => ({
  id,
  main: `file:///${id}.jpg`,
  bytes,
  seen,
})

describe('chooseEvictions', () => {
  it('lets main files go after 30 days unseen', () => {
    expect(
      chooseEvictions(
        [photo('old', '2026-09-01T00:00:00.000Z'), photo('new', '2026-10-20T00:00:00.000Z')],
        10 * mb,
        now,
      ),
    ).toEqual(['old'])
  })

  it('removes the least recently seen while the folder is over 500 MB', () => {
    const recent = [
      photo('a', '2026-10-20T00:00:00.000Z', 100 * mb),
      photo('b', '2026-10-25T00:00:00.000Z', 100 * mb),
    ]
    expect(chooseEvictions(recent, 550 * mb, now)).toEqual(['a'])
    expect(chooseEvictions(recent, 400 * mb, now)).toEqual([])
  })
})
