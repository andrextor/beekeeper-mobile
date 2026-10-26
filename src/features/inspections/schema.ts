import { z } from 'zod'

import { oneOf } from '@/lib/form'
import {
  attentionLevelLabels,
  broodPatternLabels,
  diseaseSignLabels,
  inspectionSourceLabels,
  observedLabels,
  pestLabels,
  plannedActionLabels,
  queenCellsLabels,
  storesLabels,
  varroaMethodLabels,
  weatherLabels,
} from '@/lib/labels'

const scale = z.number().int().min(1).max(5).nullable()
const frames = z.number().int().min(0).max(40, 'De 0 a 40 cuadros.').nullable()

/** A subset of a label table; an empty choice is stored as `null` (not recorded). */
const subset = (labels: Readonly<Record<string, string>>) =>
  z
    .array(z.string())
    .nullable()
    .refine(
      (values) => values === null || values.every((v) => Object.hasOwn(labels, v)),
      'Elige opciones de la lista.',
    )
    .transform((values) => (values?.length ? values : null))

/** Varroa methods that need the sample size (B4). */
export const methodsWithSample: ReadonlySet<string> = new Set(['alcohol_wash', 'sugar_roll'])

/**
 * Every B4 check on `inspections`, run before Terminar so the outbox never carries a row the server
 * would refuse. Only `inspected_at` and `source` are required: a half-filled inspection is fine.
 */
export const inspectionSchema = (now: Date) =>
  z
    .object({
      inspected_at: z
        .string()
        .refine(
          (at) => new Date(at).getTime() <= now.getTime() + 86_400_000,
          'La fecha no puede ser futura.',
        ),
      source: z.string().refine((s) => Object.hasOwn(inspectionSourceLabels, s)),
      transcript: z.string().max(10_000).nullable(),
      population_strength: scale,
      temperament: scale,
      queen_seen: oneOf(observedLabels),
      eggs_seen: oneOf(observedLabels),
      larvae_seen: oneOf(observedLabels),
      queen_cells: oneOf(queenCellsLabels),
      brood_frames: frames,
      honey_frames: frames,
      pollen_frames: frames,
      brood_pattern: oneOf(broodPatternLabels),
      stores: oneOf(storesLabels),
      varroa_method: oneOf(varroaMethodLabels),
      varroa_count: z.number().int().min(0).nullable(),
      varroa_sample_size: z.number().int().min(1).nullable(),
      pests: subset(pestLabels),
      disease_signs: subset(diseaseSignLabels),
      weather: oneOf(weatherLabels),
      temperature_c: z.number().min(-20).max(60, 'De −20 a 60 °C.').nullable(),
      attention_level: oneOf(attentionLevelLabels),
      planned_actions: subset(plannedActionLabels),
      next_inspection_on: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
      notes: z
        .string()
        .max(4000, 'Máximo 4000 caracteres.')
        .nullable()
        .transform((n) => (n?.trim() ? n.trim() : null)),
    })
    .superRefine((v, ctx) => {
      // B4 `inspections_varroa_check`: method and count together; a sample only with a method,
      // and required for alcohol wash and sugar roll.
      if (v.varroa_count !== null && v.varroa_method === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['varroa_method'],
          message: 'Elige cómo contaste la varroa.',
        })
      }
      if (v.varroa_method !== null && v.varroa_count === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['varroa_count'],
          message: 'Escribe cuántas varroas contaste.',
        })
      }
      if (v.varroa_sample_size !== null && v.varroa_method === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['varroa_method'],
          message: 'Elige cómo contaste la varroa.',
        })
      }
      if (
        v.varroa_method &&
        methodsWithSample.has(v.varroa_method) &&
        v.varroa_sample_size === null
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['varroa_sample_size'],
          message: 'Indica cuántas abejas tenía la muestra.',
        })
      }
    })

export type InspectionDraft = z.input<ReturnType<typeof inspectionSchema>>
export type InspectionFields = z.output<ReturnType<typeof inspectionSchema>>

export const emptyInspection = (inspectedAt: string): InspectionDraft => ({
  inspected_at: inspectedAt,
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
})

/** Free text up to `max` (a note event: 2000, B4 `hive_events_details_check`; the inspection's notes: 4000). */
export const noteText = (max = 2000) =>
  z.string().trim().min(1, 'Escribe la nota.').max(max, `Máximo ${max} caracteres.`)
