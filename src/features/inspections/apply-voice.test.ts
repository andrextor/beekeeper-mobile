import { parseInspection } from '@/features/voice/parser'
import { applyProposals } from './apply-voice'
import { emptyInspection } from './schema'

const draft = {
  ...emptyInspection('2026-11-01T09:00:00.000Z'),
  attention_level: 'urgent',
  pests: ['ants'],
}
const proposals = (text: string) => parseInspection(text, { today: '2026-11-01', hiveName: 'C-01' })

describe('applyProposals', () => {
  it('fills the draft, marks it as voice and appends the transcript', () => {
    const text = 'Tres cuadros de cría, vi polilla y hormigas, hay que alimentar'
    const { fields } = applyProposals({ ...draft, transcript: 'Antes' }, proposals(text), text)
    expect(fields).toMatchObject({
      source: 'voice',
      brood_frames: 3,
      pests: ['ants', 'wax_moth'],
      planned_actions: ['feed'],
      attention_level: 'urgent',
      transcript: `Antes\n${text}`,
    })
  })

  it('keeps a feeding for Terminar and a hive mismatch as a warning', () => {
    const text = 'Colmena 12, le di dos litros de jarabe'
    const applied = applyProposals(draft, proposals(text), text)
    expect(applied.feedings).toEqual([{ feed: 'sugar_syrup', amount: 2, unit: 'l' }])
    expect(applied.warnings).toEqual(['12'])
  })

  it('applies only what the person accepted', () => {
    const text = 'Reservas bajas, fuerza cuatro'
    const [stores] = proposals(text)
    const { fields } = applyProposals(draft, stores ? [stores] : [], text)
    expect(fields.stores).toBe('low')
    expect(fields.population_strength).toBeNull()
  })
})
