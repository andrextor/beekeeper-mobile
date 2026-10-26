import { dueForCheck, isNewer } from './check'

describe('dueForCheck', () => {
  it('waits an hour between checks', () => {
    expect(dueForCheck(0, 1)).toBe(true)
    expect(dueForCheck(1_000, 1_000 + 59 * 60_000)).toBe(false)
    expect(dueForCheck(1_000, 1_000 + 60 * 60_000)).toBe(true)
  })
})

describe('isNewer', () => {
  it('compares each part as a number', () => {
    expect(isNewer('1.0.1', '1.0.0')).toBe(true)
    expect(isNewer('1.10.0', '1.9.9')).toBe(true)
    expect(isNewer('1.0.0', '1.0.0')).toBe(false)
    expect(isNewer('0.11.0', '1.0.0')).toBe(false)
  })

  it('never offers an unreadable version', () => {
    expect(isNewer('2.0', '1.0.0')).toBe(false)
    expect(isNewer('1.0.1', '')).toBe(false)
  })
})
