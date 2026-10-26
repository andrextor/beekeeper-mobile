import { z } from 'zod'

import { oneOf, optionalText, tooLong } from '@/lib/form'
import {
  colonyOriginLabels,
  hiveStatusLabels,
  hiveTypeLabels,
  queenColorLabels,
  queenOriginLabels,
} from '@/lib/labels'

const count = (max: number) =>
  z.number().int().min(0, `De 0 a ${max}.`).max(max, `De 0 a ${max}.`).nullable()

const queenYear = 'El año va de 2000 a 2100.'

/** Every B3 rule for `hives` (`qr_code` is generated, never typed). `today` is "YYYY-MM-DD". */
export const hiveSchema = (today: string) =>
  z.object({
    name: z.string().trim().min(1, 'Escribe el nombre de la colmena.').max(40, tooLong(40)),
    apiary_id: z.string().min(1, 'Elige el apiario.'),
    hive_type: oneOf(hiveTypeLabels),
    brood_boxes: count(5),
    supers: count(10),
    colony_origin: oneOf(colonyOriginLabels),
    colony_started_on: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((date) => date <= today, 'La fecha no puede ser futura.')
      .nullable(),
    bee_race: optionalText(60),
    queen_year: z.number().int().min(2000, queenYear).max(2100, queenYear).nullable(),
    queen_marked: z.boolean().nullable(),
    queen_color: oneOf(queenColorLabels),
    queen_origin: oneOf(queenOriginLabels),
    status: z
      .string()
      .refine((value) => Object.hasOwn(hiveStatusLabels, value), 'Elige el estado.'),
    notes: optionalText(2000),
  })

export type HiveDraft = z.input<ReturnType<typeof hiveSchema>>
export type HiveFields = z.output<ReturnType<typeof hiveSchema>>

export const emptyHive = (apiaryId: string, name: string): HiveDraft => ({
  name,
  apiary_id: apiaryId,
  hive_type: null,
  brood_boxes: null,
  supers: null,
  colony_origin: null,
  colony_started_on: null,
  bee_race: '',
  queen_year: null,
  queen_marked: null,
  queen_color: null,
  queen_origin: null,
  status: 'active',
  notes: '',
})

export { localDay } from '@/lib/dates'
