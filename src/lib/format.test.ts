import {
  formatAltitude,
  formatAmount,
  formatCalendarDate,
  formatColonyAge,
  formatDate,
  formatLastInspection,
  formatNumber,
  formatRelative,
} from './format'

const now = new Date('2026-10-26T15:00:00Z')

describe('formatRelative', () => {
  it('uses minutes, hours and days under a week', () => {
    expect(formatRelative('2026-10-26T14:55:00Z', now)).toBe('hace 5 minutos')
    expect(formatRelative('2026-10-26T12:00:00Z', now)).toBe('hace 3 horas')
    expect(formatRelative('2026-10-25T15:00:00Z', now)).toBe('ayer')
    expect(formatRelative('2026-10-21T15:00:00Z', now)).toBe('hace 5 días')
  })

  it('switches to the absolute date from seven days on', () => {
    expect(formatRelative('2026-10-19T15:00:00Z', now)).toBe(formatDate('2026-10-19T15:00:00Z'))
  })
})

describe('formatNumber', () => {
  it('groups thousands the Colombian way', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })
})

describe('formatColonyAge', () => {
  const today = new Date(2026, 9, 26)

  it('counts whole months and years', () => {
    expect(formatColonyAge('2026-10-10', today)).toBe('Menos de un mes')
    expect(formatColonyAge('2026-09-26', today)).toBe('1 mes')
    expect(formatColonyAge('2026-07-27', today)).toBe('2 meses')
    expect(formatColonyAge('2025-10-26', today)).toBe('1 año')
    expect(formatColonyAge('2025-03-14', today)).toBe('1 año y 7 meses')
    expect(formatColonyAge('2027-01-01', today)).toBe('Menos de un mes')
  })

  it('completes a month on the last day of a shorter month', () => {
    expect(formatColonyAge('2026-01-31', new Date(2026, 1, 28))).toBe('1 mes')
    expect(formatColonyAge('2026-03-31', new Date(2026, 3, 30))).toBe('1 mes')
    expect(formatColonyAge('2026-03-31', new Date(2026, 3, 29))).toBe('Menos de un mes')
  })
})

describe('formatAltitude', () => {
  it('groups thousands in meters', () => {
    expect(formatAltitude(2550)).toBe('2.550 m')
  })
})

describe('formatCalendarDate', () => {
  it('keeps the calendar day in any time zone', () => {
    expect(formatCalendarDate('2026-11-01')).toBe(formatDate(new Date(2026, 10, 1).toISOString()))
  })

  it('shows text that is not a calendar date as is', () => {
    expect(formatCalendarDate('pronto')).toBe('pronto')
    expect(formatCalendarDate('2026-11-01T00:00:00Z')).toBe('2026-11-01T00:00:00Z')
  })
})

describe('formatAmount', () => {
  it('writes the unit after a Colombian number', () => {
    expect(formatAmount(1.5, 'kg')).toBe('1,5 kg')
    expect(formatAmount(2, 'l')).toBe('2 l')
    expect(formatAmount(34, '°C')).toBe('34 °C')
  })
})

describe('formatLastInspection', () => {
  it('reads as Spanish both under and over a week', () => {
    expect(formatLastInspection('2026-10-23T15:00:00Z', now)).toBe('Última revisión hace 3 días')
    expect(formatLastInspection('2026-10-14T15:00:00Z', now)).toBe(
      `Última revisión el ${formatDate('2026-10-14T15:00:00Z')}`,
    )
    expect(formatLastInspection(null, now)).toBe('Sin revisiones')
  })
})

describe('malformed timestamps', () => {
  it('show as is instead of throwing', () => {
    expect(formatDate('')).toBe('')
    expect(formatRelative('ayer?', now)).toBe('ayer?')
  })
})
