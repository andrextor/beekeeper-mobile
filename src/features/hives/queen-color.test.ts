import { suggestQueenColor } from './queen-color'

describe('suggestQueenColor', () => {
  it('follows the international marking colours', () => {
    expect([2021, 2022, 2023, 2024, 2025, 2026, 2030].map(suggestQueenColor)).toEqual([
      'white',
      'yellow',
      'red',
      'green',
      'blue',
      'white',
      'blue',
    ])
  })
})
