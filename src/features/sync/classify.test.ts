import { classify, retryDelayMs } from './classify'

const domain = (details: string) => ({ code: 'P0001', details, message: 'x' })

describe('classify', () => {
  it.each([
    [{ message: 'TypeError: Network request failed' }, 0],
    [{ message: 'AbortError: Aborted' }, 0],
    [{ message: 'JWT expired' }, 401],
    [{ message: 'Too many requests' }, 429],
    [{ message: 'Bad gateway' }, 502],
    [new Error('unexpected'), undefined],
  ])('retries %p (%p)', (error, status) => {
    expect(classify(error, status, true)).toBe('retry')
  })

  it.each([
    [domain('parent_mismatch'), 400],
    [domain('apiary_not_empty'), 400],
    [{ code: '23505', message: 'hives_apiary_name_key' }, 409],
    [{ code: '23514', message: 'inspections_temperature_c_check' }, 400],
    [{ code: '42501', message: 'new row violates row-level security policy' }, 403],
  ])('needs attention for %p (%p)', (error, status) => {
    expect(classify(error, status, true)).toBe('attention')
  })

  it('drops an edit under a deleted parent, never a row created offline', () => {
    expect(classify(domain('parent_deleted'), 400, true)).toBe('drop')
    expect(classify(domain('parent_deleted'), 400, false)).toBe('attention')
  })
})

describe('retryDelayMs', () => {
  it('backs off 5 s, 30 s, 2 min, then 10 min forever', () => {
    expect([1, 2, 3, 4, 5, 40].map(retryDelayMs)).toEqual([
      5_000, 30_000, 120_000, 600_000, 600_000, 600_000,
    ])
  })
})
