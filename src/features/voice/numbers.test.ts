import { numberSource, parseNumber } from './numbers'

describe('Spanish numbers', () => {
  it.each([
    ['cero', 0],
    ['una', 1],
    ['3', 3],
    ['doce', 12],
    ['dieciseis', 16],
    ['veintiun', 21],
    ['veinticuatro', 24],
    ['treinta', 30],
    ['treinta y dos', 32],
    ['noventa y nueve', 99],
  ])('reads %s', (phrase, value) => {
    expect(parseNumber(phrase)).toBe(value)
    expect(new RegExp(`^${numberSource}$`).test(phrase)).toBe(true)
  })

  it('refuses what is not a number', () => {
    expect(parseNumber('medio')).toBeNull()
    expect(parseNumber('veinte y dos')).toBeNull()
  })

  it('matches the longest number in a phrase', () => {
    expect(new RegExp(numberSource).exec('son treinta y dos varroas')?.[0]).toBe('treinta y dos')
    expect(new RegExp(numberSource).exec('veintiuno cuadros')?.[0]).toBe('veintiuno')
  })
})
