import { parseInspection } from './parser'

const options = { today: '2026-11-01', hiveName: 'C-01' }
const read = (text: string) =>
  parseInspection(text, options).map((p) => [p.field, p.value] as [string, unknown])

// Spec M8 → Parser test cases (today 2026-11-01, open hive C-01).
const cases: [string, string, [string, unknown][]][] = [
  ['1', 'La reina no se vio', [['queen_seen', 'no']]],
  ['2', 'Reina vista', [['queen_seen', 'yes']]],
  ['3', 'Vi la reina', [['queen_seen', 'yes']]],
  ['4', 'No encontré la reina', [['queen_seen', 'no']]],
  ['5', 'No revisé la reina', [['queen_seen', 'not_checked']]],
  ['6', 'Hay buena postura', [['eggs_seen', 'yes']]],
  ['7', 'No hay huevos', [['eggs_seen', 'no']]],
  ['8', 'Sin larvas', [['larvae_seen', 'no']]],
  ['9', 'Tres cuadros de cría', [['brood_frames', 3]]],
  ['10', '3 marcos de cría', [['brood_frames', 3]]],
  ['11', 'Doce cuadros de miel', [['honey_frames', 12]]],
  ['12', 'Veintiún cuadros de cría', [['brood_frames', 21]]],
  ['13', 'Dos cuadros de polen', [['pollen_frames', 2]]],
  ['14', 'Reservas bajas', [['stores', 'low']]],
  ['15', 'Pocas reservas', [['stores', 'low']]],
  ['16', 'Reservas buenas', [['stores', 'ok']]],
  ['17', 'Está llena de miel', [['stores', 'high']]],
  ['18', 'Fuerza cuatro', [['population_strength', 4]]],
  ['19', 'Colmena muy débil', [['population_strength', 1]]],
  ['20', 'Fuerza 7', []],
  ['21', 'Muy brava', [['temperament', 5]]],
  ['22', 'Estaba mansa', [['temperament', 1]]],
  ['22b', 'Estaba tranquila', [['temperament', 2]]],
  ['23', 'Hay celdas reales', [['queen_cells', 'swarm']]],
  ['24', 'No hay realeras', [['queen_cells', 'none']]],
  ['25', 'Celdas de reemplazo', [['queen_cells', 'supersedure']]],
  ['26', 'Cría salteada', [['brood_pattern', 'spotty']]],
  ['27', 'Cría compacta', [['brood_pattern', 'compact']]],
  [
    '28',
    'Vi polilla y hormigas',
    [
      ['pests', 'wax_moth'],
      ['pests', 'ants'],
    ],
  ],
  ['29', 'No hay escarabajo', []],
  ['30', 'Algunas avispas', [['pests', 'wasps']]],
  ['31', 'Cría yesada', [['disease_signs', 'chalkbrood']]],
  ['32', 'Abejas con alas deformes', [['disease_signs', 'deformed_wings']]],
  ['33', 'Olor a podrido', [['disease_signs', 'foulbrood_signs']]],
  [
    '34',
    'Siete varroas en el lavado',
    [
      ['varroa_count', 7],
      ['varroa_method', 'alcohol_wash'],
    ],
  ],
  [
    '35',
    'Cinco varroas en la lámina',
    [
      ['varroa_count', 5],
      ['varroa_method', 'sticky_board'],
    ],
  ],
  ['36', 'Revisar en ocho días', [['next_inspection_on', '2026-11-09']]],
  ['37', 'Volver en dos semanas', [['next_inspection_on', '2026-11-15']]],
  ['38', 'Revisar la próxima semana', [['next_inspection_on', '2026-11-08']]],
  ['39', 'En un mes', [['next_inspection_on', '2026-12-01']]],
  ['40', 'Es urgente', [['attention_level', 'urgent']]],
  [
    '41',
    'Hay que alimentar',
    [
      ['planned_actions', 'feed'],
      ['attention_level', 'soon'],
    ],
  ],
  [
    '42',
    'Le di dos litros de jarabe',
    [['feeding_event', { feed: 'sugar_syrup', amount: 2, unit: 'l' }]],
  ],
  [
    '43',
    'Día soleado, veinticuatro grados',
    [
      ['weather', 'sunny'],
      ['temperature_c', 24],
    ],
  ],
  ['44', 'Está lloviendo', [['weather', 'rain']]],
  [
    '45',
    'Colmena 12, la reina no se vio',
    [
      ['hive_mismatch', '12'],
      ['queen_seen', 'no'],
    ],
  ],
  ['46', 'Colmena C-01, reservas bajas', [['stores', 'low']]],
  ['47', 'Reservas bajas, bueno no, reservas normales', [['stores', 'ok']]],
  [
    '48',
    'La reina no se vio, hay buena postura, tres cuadros de cría, reservas bajas. Alimentar y revisar en ocho días.',
    [
      ['queen_seen', 'no'],
      ['eggs_seen', 'yes'],
      ['brood_frames', 3],
      ['stores', 'low'],
      ['planned_actions', 'feed'],
      ['attention_level', 'soon'],
      ['next_inspection_on', '2026-11-09'],
    ],
  ],
  ['49', '', []],
  ['50', 'Todo bien hoy', []],
]

describe('parseInspection', () => {
  it.each(cases)('case %s: %s', (_n, text, expected) => {
    expect(read(text)).toEqual(expected)
  })

  it('marks guesses and repeated fields as medium confidence', () => {
    const [postura] = parseInspection('Hay buena postura', options)
    expect(postura?.confidence).toBe('medium')
    const [frames] = parseInspection('Tres cuadros de cría', options)
    expect(frames?.confidence).toBe('high')
    const [stores] = parseInspection('Reservas bajas, bueno no, reservas normales', options)
    expect(stores?.confidence).toBe('medium')
  })

  it('points at the original words, accents included', () => {
    const [frames] = parseInspection('Hoy: Veintiún cuadros de cría', options)
    expect(frames?.phrase).toBe('Veintiún cuadros de cría')
    expect(frames?.span).toEqual([5, 29])
  })

  it('keeps a feeding even when its sentence also names stores or pests', () => {
    expect(read('Le di jarabe porque hay poca miel')).toEqual([
      ['feeding_event', { feed: 'sugar_syrup' }],
      ['stores', 'low'],
    ])
  })

  it('does not carry a "no" across "pero"', () => {
    expect(read('No vi la reina pero hay huevos')).toEqual([
      ['queen_seen', 'no'],
      ['eggs_seen', 'yes'],
    ])
  })

  it('keeps "viento fuerte" as weather, not colony strength', () => {
    expect(read('Viento fuerte')).toEqual([['weather', 'windy']])
  })
})
