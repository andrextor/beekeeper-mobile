import { z } from 'zod'

import {
  feedLabels,
  harvestProductLabels,
  lossCauseLabels,
  queenChangeReasonLabels,
  queenColorLabels,
  queenOriginLabels,
  treatmentMethodLabels,
} from '@/lib/labels'

const keys = (labels: Readonly<Record<string, string>>) =>
  Object.keys(labels) as [string, ...string[]]
const oneOf = (labels: Readonly<Record<string, string>>) => z.enum(keys(labels))
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const id = z.string().min(1)

// `details` per type, exactly api.md → Events. Loose objects: a key a newer app or the admin added
// survives an edit here instead of being dropped.
export const detailSchemas = {
  note: z.looseObject({
    text: z.string().trim().min(1, 'Escribe la nota.').max(2000, 'Máximo 2000 caracteres.'),
    source: z.enum(['voice', 'text']),
    slot: z.number().int().positive().optional(),
  }),
  feeding: z.looseObject({
    feed: oneOf(feedLabels),
    amount: z.number().positive().optional(),
    unit: z.enum(['l', 'kg', 'g']).optional(),
    ratio: z.enum(['1:1', '2:1']).optional(),
  }),
  treatment: z.looseObject({
    product: z.string().trim().min(1, 'Escribe el producto.').max(120),
    active_ingredient: z.string().trim().max(120).optional(),
    dose: z.string().trim().max(120).optional(),
    method: oneOf(treatmentMethodLabels).optional(),
    withdrawal_days: z.number().int().min(0).optional(),
    ends_on: day.optional(),
  }),
  queen_change: z.looseObject({
    queen_year: z.number().int().min(2000).max(2100).optional(),
    queen_color: oneOf(queenColorLabels).optional(),
    queen_origin: oneOf(queenOriginLabels).optional(),
    reason: oneOf(queenChangeReasonLabels).optional(),
  }),
  harvest: z.looseObject({
    product: oneOf(harvestProductLabels),
    kg: z.number().positive('Indica los kilos.'),
    supers_taken: z.number().int().min(0).optional(),
  }),
  split: z.looseObject({ new_hive_id: id.optional() }),
  merge: z.looseObject({ merged_hive_id: id.optional() }),
  transfer: z.looseObject({ from_apiary_id: id.optional(), to_apiary_id: id.optional() }),
  swarm: z.looseObject({ captured: z.boolean(), new_hive_id: id.optional() }),
  loss: z.looseObject({ cause: oneOf(lossCauseLabels).optional() }),
} as const

export type EventType = keyof typeof detailSchemas

/** What a person picks; `qr_relabel` is written only by M5's re-label. */
export const pickableTypes: readonly EventType[] = [
  'feeding',
  'treatment',
  'harvest',
  'queen_change',
  'split',
  'swarm',
  'merge',
  'transfer',
  'loss',
  'note',
]

export const isEventType = (type: string): type is EventType => Object.hasOwn(detailSchemas, type)

/** Unset choices are left out of `details` (not stored as null), then checked against the type. */
export function checkDetails(
  type: EventType,
  details: Record<string, unknown>,
): { ok: true; details: Record<string, unknown> } | { ok: false; message: string } {
  const set = Object.fromEntries(
    Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  )
  const parsed = detailSchemas[type].safeParse(set)
  return parsed.success
    ? { ok: true, details: parsed.data as Record<string, unknown> }
    : { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }
}
