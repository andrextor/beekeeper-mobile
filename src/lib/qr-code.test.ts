import { isQrCode, newQrCode } from './qr-code'

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
