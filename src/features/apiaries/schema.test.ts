import { fieldErrors } from '@/lib/form'
import { apiarySchema, emptyApiary, nameTaken } from './schema'

describe('apiarySchema', () => {
  it('turns empty optional text into null and trims', () => {
    const parsed = apiarySchema.parse({
      ...emptyApiary,
      name: '  Vallecito 2 ',
      altitude_m: '2600',
    })
    expect(parsed).toMatchObject({ name: 'Vallecito 2', farm_name: null, altitude_m: 2600 })
  })

  it('reports each broken rule on its field', () => {
    const result = apiarySchema.safeParse({
      ...emptyApiary,
      name: ' ',
      place: 'x'.repeat(121),
      altitude_m: '6001',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(fieldErrors(result.error)).toEqual({
      name: 'Escribe el nombre del apiario.',
      place: 'Máximo 120 caracteres.',
      altitude_m: 'La altitud va de −100 a 6000 m, sin decimales.',
    })
  })

  it('needs both coordinates or neither', () => {
    const half = apiarySchema.safeParse({ ...emptyApiary, name: 'A', latitude: 4.7 })
    expect(half.success ? {} : fieldErrors(half.error)).toEqual({
      latitude: 'La ubicación necesita latitud y longitud.',
    })
    expect(
      apiarySchema.safeParse({ ...emptyApiary, name: 'A', latitude: 4.7, longitude: -74.1 })
        .success,
    ).toBe(true)
  })

  it('rejects decimals in the altitude', () => {
    expect(apiarySchema.safeParse({ ...emptyApiary, name: 'A', altitude_m: '25.5' }).success).toBe(
      false,
    )
  })
})

describe('nameTaken', () => {
  it('ignores case and spaces around', () => {
    expect(nameTaken(' vallecito 1 ', ['Vallecito 1', 'La Loma'])).toBe(true)
    expect(nameTaken('Vallecito 2', ['Vallecito 1'])).toBe(false)
  })
})
