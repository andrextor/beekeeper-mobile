import { nextHiveName } from './next-name'

describe('nextHiveName', () => {
  it('follows the highest C-number in the apiary', () => {
    expect(nextHiveName(['C-01', 'C-03', 'C-02', 'Reina vieja'])).toBe('C-04')
    expect(nextHiveName(['C-12', 'c-9'])).toBe('C-13')
    expect(nextHiveName(['C-099'])).toBe('C-100')
  })

  it('starts at C-01', () => {
    expect(nextHiveName([])).toBe('C-01')
  })
})
