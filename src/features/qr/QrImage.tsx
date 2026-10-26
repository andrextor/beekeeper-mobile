import { SvgXml } from 'react-native-svg'

import { qrSvg } from './qr-svg'

/** The label's QR on screen, square. */
export function QrImage({ code, size }: { code: string; size: number }) {
  return <SvgXml xml={qrSvg(code)} width={size} height={size} />
}
