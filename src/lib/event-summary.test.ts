import { eventSummary } from './event-summary'
import { formatCalendarDate } from './format'

describe('eventSummary', () => {
  it('summarizes every event shape in docs/api.md', () => {
    expect(eventSummary('note', { text: 'Hormigas en el soporte', source: 'voice', slot: 1 })).toBe(
      'Nota · Hormigas en el soporte',
    )
    expect(
      eventSummary('feeding', { feed: 'sugar_syrup', amount: 2, unit: 'l', ratio: '1:1' }),
    ).toBe('Alimentación · Jarabe de azúcar 1:1 · 2 l')
    expect(
      eventSummary('treatment', {
        product: 'Ácido oxálico',
        dose: '5 ml por cuadro',
        method: 'drip',
        withdrawal_days: 0,
        ends_on: '2026-11-01',
      }),
    ).toBe(
      `Tratamiento · Ácido oxálico · 5 ml por cuadro · Goteo · Retiro: 0 días · Hasta el ${formatCalendarDate('2026-11-01')}`,
    )
    expect(
      eventSummary('queen_change', {
        queen_year: 2026,
        queen_color: 'white',
        queen_origin: 'purchased',
        reason: 'failing',
      }),
    ).toBe('Cambio de reina · Reina 2026 · Blanco · Comprada · Reina fallando')
    expect(eventSummary('harvest', { product: 'honey', kg: 12.5, supers_taken: 1 })).toBe(
      'Cosecha · Miel · 12,5 kg · 1 alza',
    )
    expect(eventSummary('split', { new_hive_id: '00000000-0000-4000-d000-000000000009' })).toBe(
      'División',
    )
    expect(eventSummary('merge', {})).toBe('Unión')
    expect(eventSummary('transfer', { to_apiary_id: '00000000-0000-4000-c000-000000000002' })).toBe(
      'Traslado',
    )
    expect(eventSummary('swarm', { captured: true })).toBe('Enjambre · Capturado')
    expect(eventSummary('loss', { cause: 'absconding' })).toBe('Pérdida · Fuga')
    expect(
      eventSummary('qr_relabel', { old_qr_code: 'V1C01A7K2M', new_qr_code: 'V1C01B8K3N' }),
    ).toBe('Cambio de etiqueta QR · V1C01A7K2M → V1C01B8K3N')
  })

  it('ignores unknown keys and wrong types, and shows unknown values as is', () => {
    expect(eventSummary('feeding', { feed: 'molasses', amount: '2', colour: 'brown' })).toBe(
      'Alimentación · molasses',
    )
    expect(eventSummary('loss', null)).toBe('Pérdida')
  })

  it('reads an unknown type as Evento', () => {
    expect(eventSummary('hibernation', { months: 3 })).toBe('Evento')
    expect(eventSummary('toString', {})).toBe('Evento')
  })
})
