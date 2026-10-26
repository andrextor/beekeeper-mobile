import { fold } from './text'

describe('fold', () => {
  it('ignores case and Spanish accents', () => {
    expect(fold('Vallécito PEÑA Güiza')).toBe('vallecito pena guiza')
  })
})
