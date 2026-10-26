import { fieldErrors } from '@/lib/form'
import { localDay } from '@/lib/dates'
import { emptyHive, hiveSchema } from './schema'

const schema = hiveSchema('2026-10-26')

describe('hiveSchema', () => {
  it('accepts a full hive and trims text', () => {
    const parsed = schema.parse({
      ...emptyHive('apiary-1', ' C-04 '),
      hive_type: 'langstroth',
      brood_boxes: 1,
      supers: 2,
      colony_started_on: '2026-10-26',
      bee_race: ' africanizada ',
      queen_year: 2026,
      queen_marked: true,
      queen_color: 'white',
    })
    expect(parsed).toMatchObject({ name: 'C-04', bee_race: 'africanizada', notes: null })
  })

  it('reports each broken rule on its field', () => {
    const result = schema.safeParse({
      ...emptyHive('', 'x'.repeat(41)),
      hive_type: 'box',
      supers: 11,
      colony_started_on: '2026-10-27',
      queen_year: 1999,
    })
    expect(result.success ? {} : fieldErrors(result.error)).toEqual({
      name: 'Máximo 40 caracteres.',
      apiary_id: 'Elige el apiario.',
      hive_type: 'Elige una opción de la lista.',
      supers: 'De 0 a 10.',
      colony_started_on: 'La fecha no puede ser futura.',
      queen_year: 'El año va de 2000 a 2100.',
    })
  })
})

describe('localDay', () => {
  it('uses the phone calendar day', () => {
    expect(localDay(new Date(2026, 9, 26, 23, 30))).toBe('2026-10-26')
  })
})
