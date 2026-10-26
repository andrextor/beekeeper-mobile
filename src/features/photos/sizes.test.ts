import { fitLongSide, storagePath, thumbPath } from './sizes'

describe('photo sizes and paths', () => {
  it('brings the long side down, never up', () => {
    expect(fitLongSide(4000, 3000, 1600)).toEqual({ width: 1600 })
    expect(fitLongSide(3000, 4000, 320)).toEqual({ height: 320 })
    expect(fitLongSide(800, 600, 1600)).toEqual({ width: 800 })
  })

  it('names the files as B5 requires', () => {
    const path = storagePath('ORG-1', 'Hive-1', 'P-1')
    expect(path).toBe('org-1/hive-1/p-1.jpg')
    expect(thumbPath(path)).toBe('org-1/hive-1/p-1.thumb.jpg')
  })
})
