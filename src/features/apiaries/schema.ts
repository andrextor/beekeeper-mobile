import { z } from 'zod'

import { optionalText, tooLong, typedInteger } from '@/lib/form'

/** Every B3 rule for `apiaries`, checked before saving so the push rarely fails. */
export const apiarySchema = z
  .object({
    name: z.string().trim().min(1, 'Escribe el nombre del apiario.').max(80, tooLong(80)),
    farm_name: optionalText(80),
    place: optionalText(120),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    altitude_m: typedInteger(-100, 6000, 'La altitud va de −100 a 6000 m, sin decimales.'),
    flora_notes: optionalText(2000),
    water_source: optionalText(200),
    notes: optionalText(2000),
  })
  .refine((a) => (a.latitude === null) === (a.longitude === null), {
    message: 'La ubicación necesita latitud y longitud.',
    path: ['latitude'],
  })

export type ApiaryDraft = z.input<typeof apiarySchema>
export type ApiaryFields = z.output<typeof apiarySchema>

export const emptyApiary: ApiaryDraft = {
  name: '',
  farm_name: '',
  place: '',
  latitude: null,
  longitude: null,
  altitude_m: '',
  flora_notes: '',
  water_source: '',
  notes: '',
}

/** Names are unique per finca among live apiaries, ignoring case (B3). */
export function nameTaken(name: string, others: readonly string[]): boolean {
  const wanted = name.trim().toLowerCase()
  return others.some((other) => other.toLowerCase() === wanted)
}
