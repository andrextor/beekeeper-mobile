import { fieldErrors } from '@/lib/form'
import { addDays } from './next-date'
import { emptyInspection, inspectionSchema, noteText } from './schema'
import { varroaLoadPercent } from './varroa'

const now = new Date('2026-10-26T15:00:00.000Z')
const schema = inspectionSchema(now)
const empty = emptyInspection('2026-10-26T14:00:00.000Z')
const problems = (draft: object) => {
  const result = schema.safeParse({ ...empty, ...draft })
  return result.success ? {} : fieldErrors(result.error)
}

describe('inspectionSchema', () => {
  it('saves an empty visit', () => {
    expect(schema.safeParse(empty).success).toBe(true)
  })

  it('accepts range edges and refuses what B4 refuses', () => {
    expect(problems({ population_strength: 1, brood_frames: 40, temperature_c: -20 })).toEqual({})
    expect(
      Object.keys(problems({ population_strength: 6, brood_frames: 41, temperature_c: 60.5 })),
    ).toEqual(['population_strength', 'brood_frames', 'temperature_c'])
    expect(problems({ pests: ['ants', 'dragons'] })).toEqual({
      pests: 'Elige opciones de la lista.',
    })
    expect(problems({ inspected_at: '2026-10-28T15:00:00.000Z' })).toEqual({
      inspected_at: 'La fecha no puede ser futura.',
    })
  })

  it('keeps the varroa trio coherent', () => {
    expect(problems({ varroa_count: 3 })).toEqual({
      varroa_method: 'Elige cómo contaste la varroa.',
    })
    expect(problems({ varroa_method: 'visual' })).toEqual({
      varroa_count: 'Escribe cuántas varroas contaste.',
    })
    expect(problems({ varroa_method: 'alcohol_wash', varroa_count: 7 })).toEqual({
      varroa_sample_size: 'Indica cuántas abejas tenía la muestra.',
    })
    expect(problems({ varroa_method: 'sticky_board', varroa_count: 12 })).toEqual({})
    expect(
      problems({ varroa_method: 'sugar_roll', varroa_count: 7, varroa_sample_size: 300 }),
    ).toEqual({})
  })

  it('stores an empty multi-choice and blank notes as not recorded', () => {
    expect(schema.parse({ ...empty, pests: [], notes: '  ' })).toMatchObject({
      pests: null,
      notes: null,
    })
  })

  it('checks a note text', () => {
    expect(noteText.safeParse(' ').success).toBe(false)
    expect(noteText.safeParse('x'.repeat(2001)).success).toBe(false)
  })
})

describe('helpers', () => {
  it('computes the varroa load with one decimal', () => {
    expect(varroaLoadPercent(7, 300)).toBe(2.3)
    expect(varroaLoadPercent(7, null)).toBeNull()
    expect(varroaLoadPercent(7, 0)).toBeNull()
  })

  it('adds calendar days across months', () => {
    expect(addDays('2026-10-26', 7)).toBe('2026-11-02')
    expect(addDays('2026-12-28', 14)).toBe('2027-01-11')
  })
})
