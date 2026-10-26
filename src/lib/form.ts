import { z } from 'zod'

/** First message per field, for showing under each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '')
    errors[field] ??= issue.message
  }
  return errors
}

export const tooLong = (max: number) => `Máximo ${max} caracteres.`

/** Optional free text up to `max`: trimmed, empty becomes `null`. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, tooLong(max))
    .transform((value) => (value === '' ? null : value))

/** A value from one of `api.md`'s label tables, or `null` (not recorded). */
export const oneOf = (labels: Readonly<Record<string, string>>) =>
  z
    .string()
    .nullable()
    .refine(
      (value) => value === null || Object.hasOwn(labels, value),
      'Elige una opción de la lista.',
    )

/** A whole number in range typed on the keyboard; empty is `null`. */
export const typedInteger = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^-?\d+$/.test(value), message)
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || (value >= min && value <= max), message)
