import { qrSvg } from './qr-svg'

describe('qrSvg', () => {
  it('draws a version-2 QR with its quiet zone, black on white', () => {
    const svg = qrSvg('V1C01A7K2M')
    // landak://h/ + 10 chars fits version 2 (25 modules) at level M; + 4 + 4 quiet zone.
    expect(svg).toContain('viewBox="0 0 33 33"')
    expect(svg).toContain('fill="white"')
    expect(svg).toMatch(/<path d="(M\d+,\d+h1v1h-1z)+" fill="black"\/>/)
  })

  it('is the same drawing for the same code', () => {
    expect(qrSvg('V1C01A7K2M')).toBe(qrSvg('V1C01A7K2M'))
    expect(qrSvg('V1C01A7K2M')).not.toBe(qrSvg('V1C02B8M3N'))
  })
})
