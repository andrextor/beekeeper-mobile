import type { Tables } from '@/db/supabase.types'
import { formatCalendarDate } from './format'
import { inspectionFields, inspectionSummary } from './inspection-summary'

type Inspection = Tables<'inspections'>

const empty: Inspection = {
  id: '00000000-0000-4000-e000-000000000001',
  organization_id: '00000000-0000-4000-b000-000000000001',
  hive_id: '00000000-0000-4000-d000-000000000001',
  inspected_at: '2026-10-25T14:00:00Z',
  inspected_by: '00000000-0000-4000-a000-000000000001',
  source: 'manual',
  transcript: null,
  population_strength: null,
  temperament: null,
  queen_seen: null,
  eggs_seen: null,
  larvae_seen: null,
  queen_cells: null,
  brood_frames: null,
  honey_frames: null,
  pollen_frames: null,
  brood_pattern: null,
  stores: null,
  varroa_method: null,
  varroa_count: null,
  varroa_sample_size: null,
  pests: null,
  disease_signs: null,
  weather: null,
  temperature_c: null,
  attention_level: null,
  planned_actions: null,
  next_inspection_on: null,
  notes: null,
  created_by: '00000000-0000-4000-a000-000000000001',
  created_at: '2026-10-25T14:00:00Z',
  updated_at: '2026-10-25T14:00:00Z',
  deleted_at: null,
}

const full: Inspection = {
  ...empty,
  population_strength: 4,
  temperament: 2,
  queen_seen: 'yes',
  eggs_seen: 'not_checked',
  brood_frames: 0,
  stores: 'low',
  varroa_method: 'alcohol_wash',
  varroa_count: 3,
  varroa_sample_size: 300,
  pests: ['ants', 'wasps'],
  temperature_c: 22.5,
  planned_actions: ['feed'],
  next_inspection_on: '2026-11-01',
}

describe('inspectionSummary', () => {
  it('reads an inspection with only the required fields', () => {
    expect(inspectionSummary(empty)).toBe('Sin datos registrados')
    expect(inspectionFields(empty)).toEqual([])
  })

  it('joins the recorded facts in one line', () => {
    expect(inspectionSummary(full)).toBe(
      'Fuerza 4 · Reina vista · 0 cuadros de cría · Reservas: Pocas · Varroa 3 · Plagas: Hormigas, Avispas',
    )
  })

  it('leaves stores out of the line when they were not checked', () => {
    expect(inspectionSummary({ ...empty, stores: 'not_checked' })).toBe('Sin datos registrados')
  })
})

describe('inspectionFields', () => {
  it('keeps a varroa count recorded without a method', () => {
    expect(inspectionFields({ ...empty, varroa_count: 12 })).toEqual([
      { label: 'Varroa', value: '12' },
    ])
  })

  it('labels every recorded field and hides the rest', () => {
    expect(inspectionFields(full)).toEqual([
      { label: 'Fuerza', value: '4 de 5' },
      { label: 'Temperamento', value: '2 de 5' },
      { label: 'Reina vista', value: 'Sí' },
      { label: 'Huevos', value: 'No revisado' },
      { label: 'Cuadros de cría', value: '0' },
      { label: 'Reservas', value: 'Pocas' },
      { label: 'Varroa', value: 'Lavado con alcohol: 3 en 300 abejas' },
      { label: 'Plagas', value: 'Hormigas, Avispas' },
      { label: 'Temperatura', value: '22,5 °C' },
      { label: 'Acciones planeadas', value: 'Alimentar' },
      { label: 'Próxima revisión', value: formatCalendarDate('2026-11-01') },
    ])
  })
})
