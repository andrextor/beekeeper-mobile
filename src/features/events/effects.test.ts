import { hiveEffects } from './effects'

describe('hiveEffects', () => {
  it('updates the queen, the apiary, the status and the merged hive for an owner', () => {
    expect(
      hiveEffects('queen_change', { queen_year: 2026, queen_color: 'white' }, 'h', true),
    ).toEqual([
      { hiveId: 'h', patch: { queen_year: 2026, queen_color: 'white', queen_marked: true } },
    ])
    expect(hiveEffects('transfer', { from_apiary_id: 'a', to_apiary_id: 'b' }, 'h', true)).toEqual([
      { hiveId: 'h', patch: { apiary_id: 'b' } },
    ])
    expect(hiveEffects('loss', { cause: 'pests' }, 'h', true, { lossStatus: 'dead' })).toEqual([
      { hiveId: 'h', patch: { status: 'dead' } },
    ])
    expect(hiveEffects('merge', { merged_hive_id: 'h2' }, 'h', true, { markMerged: true })).toEqual(
      [{ hiveId: 'h2', patch: { status: 'merged' } }],
    )
  })

  it('never updates a hive for a reviewer', () => {
    for (const type of ['queen_change', 'transfer', 'loss', 'merge']) {
      expect(
        hiveEffects(
          type,
          { queen_year: 2026, to_apiary_id: 'b', merged_hive_id: 'h2' },
          'h',
          false,
          {
            lossStatus: 'dead',
            markMerged: true,
          },
        ),
      ).toEqual([])
    }
  })

  it('changes nothing for events without effects or without a choice', () => {
    expect(hiveEffects('feeding', { feed: 'honey' }, 'h', true)).toEqual([])
    expect(hiveEffects('loss', { cause: 'pests' }, 'h', true)).toEqual([])
  })
})
