// Ported from beekeeper admin/src/lib/inspection-summary.ts: the phone and the panel read the same line.
import type { Tables } from '@/db/supabase.types'
import { formatCalendarDate, formatNumber, plural } from './format'
import {
  attentionLevelLabels,
  broodPatternLabels,
  diseaseSignLabels,
  label,
  observedLabels,
  pestLabels,
  plannedActionLabels,
  queenCellsLabels,
  storesLabels,
  varroaMethodLabels,
  weatherLabels,
} from './labels'

type Inspection = Tables<'inspections'>

export type Field = { label: string; value: string }

function labels(map: Readonly<Record<string, string>>, values: string[] | null): string | null {
  return values?.length ? values.map((value) => label(map, value)).join(', ') : null
}

function outOfFive(value: number | null): string | null {
  return value === null ? null : `${value} de 5`
}

function varroa(inspection: Inspection): string | null {
  if (inspection.varroa_count === null) return null
  const sample = inspection.varroa_sample_size
  const count = `${formatNumber(inspection.varroa_count)}${sample ? ` en ${formatNumber(sample)} abejas` : ''}`
  return inspection.varroa_method
    ? `${label(varroaMethodLabels, inspection.varroa_method)}: ${count}`
    : count
}

/** One line for the timeline: "Fuerza 4 · Reina vista · 7 cuadros de cría · Reservas: Pocas". */
export function inspectionSummary(inspection: Inspection): string {
  const parts = [
    inspection.population_strength !== null && `Fuerza ${inspection.population_strength}`,
    inspection.queen_seen === 'yes' && 'Reina vista',
    inspection.queen_seen === 'no' && 'Reina no vista',
    inspection.brood_frames !== null &&
      plural(inspection.brood_frames, 'cuadro de cría', 'cuadros de cría'),
    inspection.stores &&
      inspection.stores !== 'not_checked' &&
      `Reservas: ${label(storesLabels, inspection.stores)}`,
    inspection.varroa_count !== null && `Varroa ${formatNumber(inspection.varroa_count)}`,
    inspection.pests?.length && `Plagas: ${labels(pestLabels, inspection.pests)}`,
    inspection.disease_signs?.length &&
      `Signos: ${labels(diseaseSignLabels, inspection.disease_signs)}`,
  ].filter((part): part is string => typeof part === 'string')
  return parts.length ? parts.join(' · ') : 'Sin datos registrados'
}

/** Every recorded field with its Spanish label; fields never recorded are left out. */
export function inspectionFields(inspection: Inspection): Field[] {
  const fields: Array<[string, string | null]> = [
    ['Fuerza', outOfFive(inspection.population_strength)],
    ['Temperamento', outOfFive(inspection.temperament)],
    ['Reina vista', inspection.queen_seen && label(observedLabels, inspection.queen_seen)],
    ['Huevos', inspection.eggs_seen && label(observedLabels, inspection.eggs_seen)],
    ['Larvas', inspection.larvae_seen && label(observedLabels, inspection.larvae_seen)],
    ['Celdas reales', inspection.queen_cells && label(queenCellsLabels, inspection.queen_cells)],
    ['Cuadros de cría', inspection.brood_frames?.toString() ?? null],
    ['Cuadros de miel', inspection.honey_frames?.toString() ?? null],
    ['Cuadros de polen', inspection.pollen_frames?.toString() ?? null],
    [
      'Patrón de cría',
      inspection.brood_pattern && label(broodPatternLabels, inspection.brood_pattern),
    ],
    ['Reservas', inspection.stores && label(storesLabels, inspection.stores)],
    ['Varroa', varroa(inspection)],
    ['Plagas', labels(pestLabels, inspection.pests)],
    ['Signos de enfermedad', labels(diseaseSignLabels, inspection.disease_signs)],
    ['Clima', inspection.weather && label(weatherLabels, inspection.weather)],
    [
      'Temperatura',
      inspection.temperature_c === null ? null : `${formatNumber(inspection.temperature_c)} °C`,
    ],
    [
      'Atención',
      inspection.attention_level && label(attentionLevelLabels, inspection.attention_level),
    ],
    ['Acciones planeadas', labels(plannedActionLabels, inspection.planned_actions)],
    [
      'Próxima revisión',
      inspection.next_inspection_on && formatCalendarDate(inspection.next_inspection_on),
    ],
  ]
  return fields.flatMap(([fieldLabel, value]) => (value ? [{ label: fieldLabel, value }] : []))
}
