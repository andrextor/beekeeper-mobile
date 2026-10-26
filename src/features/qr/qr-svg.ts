import qrcode from 'qrcode-generator'

import { qrPayload } from '@/lib/qr-code'

const quietZone = 4

/**
 * The label's QR as an SVG string (error correction M, 4-module quiet zone), black on white
 * whatever the theme: the same string renders on screen and goes into the print HTML.
 */
export function qrSvg(code: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(qrPayload(code))
  qr.make()
  const modules = qr.getModuleCount()
  const size = modules + quietZone * 2
  let path = ''
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (qr.isDark(row, col)) path += `M${col + quietZone},${row + quietZone}h1v1h-1z`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="white"/><path d="${path}" fill="black"/></svg>`
}
