import type { SqlValue } from './db'
import type { Tables } from './supabase.types'

/** Mirrored server tables, parent first: the push and pull order. */
export const syncedTables = ['apiaries', 'hives', 'inspections', 'hive_events', 'photos'] as const
export type SyncedTable = (typeof syncedTables)[number]
export type ServerRow<T extends SyncedTable = SyncedTable> = Tables<T>
export type LocalRow = Record<string, SqlValue>

const common = [
  'id',
  'organization_id',
  'created_by',
  'created_at',
  'updated_at',
  'deleted_at',
] as const

export const columns: { [T in SyncedTable]: readonly (keyof Tables<T> & string)[] } = {
  apiaries: [
    ...common,
    'name',
    'farm_name',
    'place',
    'latitude',
    'longitude',
    'altitude_m',
    'flora_notes',
    'water_source',
    'notes',
  ],
  hives: [
    ...common,
    'apiary_id',
    'name',
    'qr_code',
    'hive_type',
    'brood_boxes',
    'supers',
    'colony_origin',
    'colony_started_on',
    'bee_race',
    'queen_year',
    'queen_marked',
    'queen_color',
    'queen_origin',
    'status',
    'notes',
  ],
  inspections: [
    ...common,
    'hive_id',
    'inspected_at',
    'inspected_by',
    'source',
    'transcript',
    'population_strength',
    'temperament',
    'queen_seen',
    'eggs_seen',
    'larvae_seen',
    'queen_cells',
    'brood_frames',
    'honey_frames',
    'pollen_frames',
    'brood_pattern',
    'stores',
    'varroa_method',
    'varroa_count',
    'varroa_sample_size',
    'pests',
    'disease_signs',
    'weather',
    'temperature_c',
    'attention_level',
    'planned_actions',
    'next_inspection_on',
    'notes',
  ],
  hive_events: [...common, 'hive_id', 'inspection_id', 'type', 'occurred_at', 'details'],
  photos: [
    ...common,
    'hive_id',
    'inspection_id',
    'storage_path',
    'taken_at',
    'width',
    'height',
    'bytes',
    'caption',
  ],
}

/** Set by the server (B3 `force_author`, `set_updated_at`); never pushed. */
const serverOwned = new Set(['created_by', 'created_at', 'updated_at'])
const booleanColumns = new Set(['queen_marked'])
const timestampColumns = new Set([
  'created_at',
  'updated_at',
  'deleted_at',
  'inspected_at',
  'occurred_at',
  'taken_at',
])

/**
 * SQLite compares timestamps as text: "…00.123456+00:00" (pulled) and "…00.123Z" (written here)
 * would order wrongly within a second. Every UTC timestamp becomes "YYYY-MM-DDTHH:MM:SS.mmmZ" by
 * rewriting the string (Hermes may not parse microseconds). Anything else stays as it is.
 */
export function normalizeTimestamp(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(?:Z|\+00(?::?00)?)$/.exec(
    value,
  )
  if (!match) return value
  return `${match[1]}T${match[2]}.${(match[3] ?? '').padEnd(3, '0').slice(0, 3)}Z`
}
const jsonColumns = new Set(['pests', 'disease_signs', 'planned_actions', 'details'])

function toSql(value: unknown): SqlValue {
  if (value === undefined || value === null) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string' || typeof value === 'number') return value
  return JSON.stringify(value)
}

function fromSql(column: string, value: SqlValue): unknown {
  if (value === null) return null
  if (booleanColumns.has(column)) return value === 1
  if (jsonColumns.has(column) && typeof value === 'string') return JSON.parse(value)
  return value
}

/** Server row → SQLite values for the table's columns (columns the app does not know are dropped). */
export function toLocal(table: SyncedTable, row: Record<string, unknown>): LocalRow {
  const cols: readonly string[] = columns[table]
  return Object.fromEntries(
    cols.map((c) => {
      const value = toSql(row[c])
      return [
        c,
        timestampColumns.has(c) && typeof value === 'string' ? normalizeTimestamp(value) : value,
      ]
    }),
  )
}

export function fromLocal<T extends SyncedTable>(table: T, row: LocalRow): ServerRow<T> {
  const cols: readonly string[] = columns[table]
  const server = Object.fromEntries(cols.map((c) => [c, fromSql(c, row[c] ?? null)]))
  return server as unknown as ServerRow<T>
}

/** What the outbox upserts: the server columns the client owns. */
export function toPayload(
  table: SyncedTable,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const cols: readonly string[] = columns[table]
  return Object.fromEntries(cols.filter((c) => !serverOwned.has(c)).map((c) => [c, row[c] ?? null]))
}
