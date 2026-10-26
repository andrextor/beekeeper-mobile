import { addDays, daysBetween } from './dates'

describe('calendar dates', () => {
  it('counts days across months', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(daysBetween('2026-11-02', '2026-10-30')).toBe(-3)
  })

  it('adds days across months and years', () => {
    expect(addDays('2026-10-26', 7)).toBe('2026-11-02')
    expect(addDays('2026-12-28', 14)).toBe('2027-01-11')
  })
})
