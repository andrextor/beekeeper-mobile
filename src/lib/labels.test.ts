import {
  attentionLevelLabels,
  colonyOriginLabels,
  broodPatternLabels,
  diseaseSignLabels,
  eventTypeLabels,
  feedLabels,
  harvestProductLabels,
  hiveStatusLabels,
  hiveTypeLabels,
  inspectionSourceLabels,
  label,
  lossCauseLabels,
  observedLabels,
  pestLabels,
  plannedActionLabels,
  populationStrengthLabels,
  queenCellsLabels,
  queenChangeReasonLabels,
  queenColorLabels,
  queenOriginLabels,
  roleLabels,
  storesLabels,
  temperamentLabels,
  treatmentMethodLabels,
  varroaMethodLabels,
  weatherLabels,
} from './labels'

// Enum values as listed in ../beekeeper/docs/api.md; a value added there fails here until labelled.
const contract: [Readonly<Record<string, string>>, string[]][] = [
  [roleLabels, ['owner', 'reviewer']],
  [hiveTypeLabels, ['langstroth', 'dadant', 'top_bar', 'warre', 'nucleus', 'rustic', 'other']],
  [
    colonyOriginLabels,
    ['swarm_capture', 'split', 'package', 'nucleus_purchase', 'colony_purchase', 'unknown'],
  ],
  [queenColorLabels, ['white', 'yellow', 'red', 'green', 'blue']],
  [queenOriginLabels, ['own_rearing', 'purchased', 'natural', 'unknown']],
  [hiveStatusLabels, ['active', 'inactive', 'dead', 'absconded', 'merged', 'sold']],
  [inspectionSourceLabels, ['manual', 'voice']],
  [observedLabels, ['yes', 'no', 'not_checked']],
  [queenCellsLabels, ['none', 'swarm', 'supersedure', 'not_checked']],
  [broodPatternLabels, ['compact', 'spotty', 'not_checked']],
  [storesLabels, ['low', 'ok', 'high', 'not_checked']],
  [varroaMethodLabels, ['alcohol_wash', 'sugar_roll', 'sticky_board', 'visual']],
  [pestLabels, ['wax_moth', 'small_hive_beetle', 'ants', 'wasps', 'mice', 'other']],
  [
    diseaseSignLabels,
    [
      'chalkbrood',
      'sacbrood',
      'foulbrood_signs',
      'deformed_wings',
      'dysentery',
      'dead_bees',
      'other',
    ],
  ],
  [weatherLabels, ['sunny', 'cloudy', 'rain', 'windy']],
  [attentionLevelLabels, ['none', 'soon', 'urgent']],
  [
    plannedActionLabels,
    [
      'feed',
      'treat',
      'change_queen',
      'add_super',
      'remove_super',
      'harvest',
      'split',
      'merge',
      'move',
      'check_queen',
      'other',
    ],
  ],
  [
    eventTypeLabels,
    [
      'note',
      'feeding',
      'treatment',
      'queen_change',
      'harvest',
      'split',
      'merge',
      'transfer',
      'swarm',
      'loss',
      'qr_relabel',
    ],
  ],
  [feedLabels, ['sugar_syrup', 'fondant', 'pollen_patty', 'honey', 'other']],
  [treatmentMethodLabels, ['strip', 'drip', 'vapor', 'dust', 'other']],
  [harvestProductLabels, ['honey', 'pollen', 'propolis', 'wax']],
  [lossCauseLabels, ['starvation', 'pests', 'disease', 'absconding', 'pesticide', 'unknown']],
  [queenChangeReasonLabels, ['failing', 'aggressive', 'lost', 'planned']],
]

describe('labels', () => {
  it.each(contract)('labels exactly the api.md values', (labels, values) => {
    expect(Object.keys(labels).sort()).toEqual([...values].sort())
  })

  it('names every step of the 1–5 scales', () => {
    expect(Object.keys(populationStrengthLabels)).toEqual(['1', '2', '3', '4', '5'])
    expect(temperamentLabels[1]).toBe('Mansa')
    expect(temperamentLabels[5]).toBe('Muy defensiva')
  })
})

describe('label', () => {
  it('translates known values', () => {
    expect(label(hiveStatusLabels, 'dead')).toBe('Muerta')
    expect(label(eventTypeLabels, 'qr_relabel')).toBe('Cambio de etiqueta QR')
  })

  it('shows an unknown value as is and a missing one as a dash', () => {
    expect(label(hiveStatusLabels, 'hibernating')).toBe('hibernating')
    expect(label(hiveStatusLabels, null)).toBe('—')
    expect(label(hiveStatusLabels, 'toString')).toBe('toString')
  })
})
