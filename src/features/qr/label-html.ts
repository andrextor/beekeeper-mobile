import { groupedQrCode } from '@/lib/qr-code'
import { qrSvg } from './qr-svg'

/** What a label shows: never the apiary, place or finca (spec M5 → Security). */
export type LabelHive = { name: string; qr_code: string }

/** Print HTML plus the page size in points (1 mm = 72 / 25.4 pt) for `expo-print`. */
export type PrintPage = { html: string; width: number; height: number }

const pt = (mm: number) => Math.round((mm * 72) / 25.4)

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const style = (pageWidth: number, pageHeight: number) => `
  @page { size: ${pageWidth}mm ${pageHeight}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: sans-serif; color: black; }
  .page { width: ${pageWidth}mm; height: ${pageHeight}mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .label { width: 60mm; height: 80mm; padding: 4mm; border: 0.2mm dashed gray;
    display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
  .name { font-size: 9mm; font-weight: 700; line-height: 1.1; text-align: center; overflow: hidden; }
  .qr svg { width: 46mm; height: 46mm; display: block; }
  .code { font-family: monospace; font-size: 4.5mm; letter-spacing: 0.4mm; }
  .brand { font-size: 3mm; }
`

function label({ name, qr_code }: LabelHive): string {
  return `<div class="label">
    <div class="name">${escape(name)}</div>
    <div class="qr">${qrSvg(qr_code)}</div>
    <div class="code">${groupedQrCode(qr_code)}</div>
    <div class="brand">Landak Apiario</div>
  </div>`
}

const htmlPage = (css: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`

/** One 6 × 8 cm label (hive screen → Etiqueta QR). */
export function singleLabelHtml(hive: LabelHive): PrintPage {
  return {
    html: htmlPage(style(60, 80), `<div class="page">${label(hive)}</div>`),
    width: pt(60),
    height: pt(80),
  }
}

const perRow = 3
const perPage = 12

/** A4 sheets, 3 × 4 labels each, in the given order (apiary screen → Imprimir etiquetas). */
export function sheetHtml(hives: readonly LabelHive[]): PrintPage {
  const pages: string[] = []
  for (let i = 0; i < hives.length; i += perPage) {
    const labels = hives
      .slice(i, i + perPage)
      .map(label)
      .join('')
    pages.push(`<div class="page sheet">${labels}</div>`)
  }
  const css = `${style(210, 297)}
  .sheet { display: grid; grid-template-columns: repeat(${perRow}, 60mm);
    grid-auto-rows: 70mm; gap: 0; justify-content: center; align-content: center; }
  .sheet .label { height: 70mm; }
  .sheet .qr svg { width: 40mm; height: 40mm; }`
  return { html: htmlPage(css, pages.join('')), width: pt(210), height: pt(297) }
}
