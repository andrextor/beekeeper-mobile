import { checkDetails } from './schemas'

describe('checkDetails', () => {
  it('accepts every documented shape and drops what was left unset', () => {
    expect(
      checkDetails('feeding', { feed: 'sugar_syrup', amount: 2, unit: 'l', ratio: '1:1' }),
    ).toEqual({
      ok: true,
      details: { feed: 'sugar_syrup', amount: 2, unit: 'l', ratio: '1:1' },
    })
    expect(
      checkDetails('treatment', { product: 'Apivar', method: 'strip', dose: '', ends_on: null }),
    ).toEqual({
      ok: true,
      details: { product: 'Apivar', method: 'strip' },
    })
    expect(checkDetails('harvest', { product: 'honey', kg: 12.5 }).ok).toBe(true)
    expect(checkDetails('swarm', { captured: false }).ok).toBe(true)
    expect(checkDetails('loss', {}).ok).toBe(true)
  })

  it('refuses what B4 or the app would refuse', () => {
    expect(checkDetails('treatment', { product: ' ' })).toEqual({
      ok: false,
      message: 'Escribe el producto.',
    })
    expect(checkDetails('harvest', { product: 'honey' }).ok).toBe(false)
    expect(checkDetails('feeding', { feed: 'molasses' }).ok).toBe(false)
    expect(checkDetails('swarm', {}).ok).toBe(false)
  })

  it('keeps keys it does not know', () => {
    expect(checkDetails('loss', { cause: 'pests', noted_by_admin: true })).toEqual({
      ok: true,
      details: { cause: 'pests', noted_by_admin: true },
    })
  })
})
