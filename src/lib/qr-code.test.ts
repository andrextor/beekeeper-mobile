import { groupedQrCode, isQrCode, newQrCode, normalizeQrCode, parseQrPayload } from './qr-code'

jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint8Array) => require('node:crypto').getRandomValues(array),
}))

describe('QR codes', () => {
  it('generates codes the server accepts', () => {
    const codes = Array.from({ length: 1000 }, newQrCode)
    expect(codes.every(isQrCode)).toBe(true)
    expect(new Set(codes).size).toBe(1000)
  })

  it('accepts exactly 10 Crockford base32 characters', () => {
    expect(isQrCode('V1C01A7K2M')).toBe(true)
    expect(isQrCode('V1C01A7K2')).toBe(false)
    expect(isQrCode('V1C01A7K2MX')).toBe(false)
    for (const letter of ['I', 'L', 'O', 'U', 'a'])
      expect(isQrCode(`V1C01A7K2${letter}`)).toBe(false)
  })
})

describe('reading codes', () => {
  it('forgives case, spaces, dashes and the letters that look like digits', () => {
    expect(normalizeQrCode(' v1c0l-a7k2m ')).toBe('V1C01A7K2M')
    expect(normalizeQrCode('VIC0IA7K2M')).toBe('V1C01A7K2M')
    expect(normalizeQrCode('v1co1a7k2m')).toBe('V1C01A7K2M')
  })

  it('accepts our link and a bare code, nothing else', () => {
    expect(parseQrPayload('landak://h/V1C01A7K2M')).toBe('V1C01A7K2M')
    expect(parseQrPayload('LANDAK://h/v1c01-a7k2m')).toBe('V1C01A7K2M')
    expect(parseQrPayload('V1C01-A7K2M')).toBe('V1C01A7K2M')
    expect(parseQrPayload('https://example.com/V1C01A7K2M')).toBeNull()
    expect(parseQrPayload('landak://x/V1C01A7K2M')).toBeNull()
    expect(parseQrPayload('landak://h/V1C01A7K2')).toBeNull()
    expect(parseQrPayload('hola mundo')).toBeNull()
  })

  it('groups the printed code in two blocks of five', () => {
    expect(groupedQrCode('V1C01A7K2M')).toBe('V1C01-A7K2M')
  })
})
