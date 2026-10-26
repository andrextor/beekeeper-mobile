import { fold, nameTaken } from './text'

describe('fold', () => {
  it('ignores case and Spanish accents', () => {
    expect(fold('Vallécito PEÑA Güiza')).toBe('vallecito pena guiza')
  })
})

describe('nameTaken', () => {
  it('ignores case and spaces around', () => {
    expect(nameTaken(' vallecito 1 ', ['Vallecito 1', 'La Loma'])).toBe(true)
    expect(nameTaken('Vallecito 2', ['Vallecito 1'])).toBe(false)
  })
})
