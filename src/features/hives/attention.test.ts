import { formatCalendarDate } from '@/lib/format'
import { daysBetween, hiveAttention } from './attention'

const today = '2026-10-26'

describe('hiveAttention', () => {
  it('says how late the next inspection is', () => {
    expect(
      hiveAttention({ attention_level: null, next_inspection_on: '2026-10-23' }, [], today),
    ).toEqual([{ kind: 'overdue', text: 'Revisión atrasada 3 días' }])
    expect(
      hiveAttention({ attention_level: 'urgent', next_inspection_on: today }, [], today),
    ).toEqual([
      { kind: 'urgent', text: 'Urgente' },
      { kind: 'due_today', text: 'Revisión para hoy' },
    ])
    expect(
      hiveAttention({ attention_level: 'none', next_inspection_on: '2026-11-01' }, [], today),
    ).toEqual([])
  })

  it('counts a treatment ending today as active, an ended one not', () => {
    const items = hiveAttention(
      null,
      [
        { details: { product: 'Apivar', ends_on: today } },
        { details: { product: 'Oxálico', ends_on: '2026-10-25' } },
        { details: null },
      ],
      today,
    )
    expect(items).toEqual([
      { kind: 'treatment', text: `Tratamiento Apivar hasta el ${formatCalendarDate(today)}` },
    ])
  })
})

describe('daysBetween', () => {
  it('counts calendar days across months', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(daysBetween('2026-11-02', '2026-10-30')).toBe(-3)
  })
})
