import { type LabelHive, sheetHtml, singleLabelHtml } from './label-html'

const hive = (n: number): LabelHive => ({
  name: `C-${String(n).padStart(2, '0')}`,
  qr_code: 'V1C01A7K2M',
})

describe('labels', () => {
  it('shows the name, the QR and the grouped code, escaped, with the brand', () => {
    const { html, width, height } = singleLabelHtml({ name: 'C-01 <A&B>', qr_code: 'V1C01A7K2M' })
    expect(html).toContain('C-01 &#60;A&#38;B&#62;')
    expect(html).toContain('V1C01-A7K2M')
    expect(html).toContain('<svg')
    expect(html).toContain('Landak Apiario')
    expect([width, height]).toEqual([170, 227])
  })

  it('puts 12 labels per A4 page', () => {
    const { html } = sheetHtml(Array.from({ length: 13 }, (_, i) => hive(i + 1)))
    expect(html.match(/class="page sheet"/g)).toHaveLength(2)
    expect(html.match(/class="label"/g)).toHaveLength(13)
  })
})
