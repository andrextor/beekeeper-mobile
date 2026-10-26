import { fromLocal, normalizeTimestamp, type ServerRow, toLocal, toPayload } from './mapping'

const meta = {
  organization_id: 'org-1',
  created_by: 'user-1',
  created_at: '2026-10-25T10:00:00.000Z',
  updated_at: '2026-10-25T10:00:00.000Z',
  deleted_at: null,
}

const hive: ServerRow<'hives'> = {
  ...meta,
  id: 'hive-1',
  apiary_id: 'apiary-1',
  name: 'C-12',
  qr_code: '0123456789',
  hive_type: 'langstroth',
  brood_boxes: 2,
  supers: 1,
  colony_origin: 'split',
  colony_started_on: '2025-03-14',
  bee_race: null,
  queen_year: 2026,
  queen_marked: false,
  queen_color: 'blue',
  queen_origin: null,
  status: 'active',
  notes: null,
}

const inspection: ServerRow<'inspections'> = {
  ...meta,
  id: 'inspection-1',
  hive_id: 'hive-1',
  inspected_at: '2026-10-25T09:00:00.000Z',
  inspected_by: 'user-1',
  source: 'voice',
  transcript: 'reina vista',
  population_strength: 4,
  temperament: 2,
  queen_seen: 'yes',
  eggs_seen: 'not_checked',
  larvae_seen: null,
  queen_cells: 'none',
  brood_frames: 6,
  honey_frames: 3,
  pollen_frames: 1,
  brood_pattern: 'compact',
  stores: 'ok',
  varroa_method: 'alcohol_wash',
  varroa_count: 3,
  varroa_sample_size: 300,
  pests: ['ants', 'wasps'],
  disease_signs: [],
  weather: 'sunny',
  temperature_c: 24.5,
  attention_level: 'soon',
  planned_actions: null,
  next_inspection_on: '2026-11-08',
  notes: null,
}

const event: ServerRow<'hive_events'> = {
  ...meta,
  id: 'event-1',
  hive_id: 'hive-1',
  inspection_id: 'inspection-1',
  type: 'feeding',
  occurred_at: '2026-10-25T09:05:00.000Z',
  details: { feed: 'sugar_syrup', amount: 2, unit: 'l', ratio: '1:1' },
}

const apiary: ServerRow<'apiaries'> = {
  ...meta,
  id: 'apiary-1',
  name: 'Vallecito 1',
  farm_name: null,
  place: 'Vereda El Cedro',
  latitude: 4.711,
  longitude: -74.072,
  altitude_m: 2600,
  flora_notes: null,
  water_source: null,
  notes: null,
}

const photo: ServerRow<'photos'> = {
  ...meta,
  id: 'photo-1',
  hive_id: 'hive-1',
  inspection_id: null,
  storage_path: 'org-1/hive-1/photo-1.jpg',
  taken_at: '2026-10-25T09:06:00.000Z',
  width: 1600,
  height: 1200,
  bytes: 250_000,
  caption: null,
}

describe('row mapping', () => {
  it.each([
    ['apiaries', apiary],
    ['hives', hive],
    ['inspections', inspection],
    ['hive_events', event],
    ['photos', photo],
  ] as const)('round-trips a %s row', (table, row) => {
    expect(fromLocal(table, toLocal(table, row))).toEqual(row)
  })

  it('stores booleans as 0/1 and arrays and objects as JSON', () => {
    expect(toLocal('hives', hive).queen_marked).toBe(0)
    expect(toLocal('inspections', inspection).pests).toBe('["ants","wasps"]')
    expect(toLocal('hive_events', event).details).toBe(
      '{"feed":"sugar_syrup","amount":2,"unit":"l","ratio":"1:1"}',
    )
  })

  it('drops columns the app does not know', () => {
    expect(toLocal('apiaries', { ...apiary, added_later: 'x' })).not.toHaveProperty('added_later')
  })

  it('never pushes the columns the server owns', () => {
    const payload = toPayload('hives', hive)
    expect(payload).not.toHaveProperty('created_by')
    expect(payload).not.toHaveProperty('created_at')
    expect(payload).not.toHaveProperty('updated_at')
    expect(payload).toMatchObject({ id: 'hive-1', deleted_at: null, queen_marked: false })
  })
})

describe('normalizeTimestamp', () => {
  it('writes every UTC timestamp with milliseconds and Z', () => {
    expect(normalizeTimestamp('2026-10-26T10:00:00.123456+00:00')).toBe('2026-10-26T10:00:00.123Z')
    expect(normalizeTimestamp('2026-10-26T10:00:00.1+00:00')).toBe('2026-10-26T10:00:00.100Z')
    expect(normalizeTimestamp('2026-10-26T10:00:00+00:00')).toBe('2026-10-26T10:00:00.000Z')
    expect(normalizeTimestamp('2026-10-26T10:00:00.123Z')).toBe('2026-10-26T10:00:00.123Z')
  })

  it('leaves dates and other offsets alone', () => {
    expect(normalizeTimestamp('2026-10-26')).toBe('2026-10-26')
    expect(normalizeTimestamp('2026-10-26T10:00:00-05:00')).toBe('2026-10-26T10:00:00-05:00')
  })

  it('is applied to timestamp columns only', () => {
    const local = toLocal('hive_events', {
      id: 'e',
      occurred_at: '2026-10-26T10:00:00+00:00',
      type: '2026-10-26T10:00:00+00:00',
    })
    expect(local.occurred_at).toBe('2026-10-26T10:00:00.000Z')
    expect(local.type).toBe('2026-10-26T10:00:00+00:00')
  })
})
