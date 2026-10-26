// Spanish numbers as spoken in the field, 0–99, on text already folded (lowercase, no accents).

const words: Readonly<Record<string, number>> = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiun: 21,
  veintiuno: 21,
  veintiuna: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
}

const tens: Readonly<Record<string, number>> = {
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
}

const units = [
  'un',
  'uno',
  'una',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
]
const longestFirst = (list: string[]) => [...list].sort((a, b) => b.length - a.length).join('|')

/** A number as a regex source: digits, "veintiun", "treinta y dos"… (longest words first). */
export const numberSource = `\\b(?:\\d{1,3}|(?:${longestFirst(Object.keys(tens))})(?:\\s+y\\s+(?:${longestFirst(units)}))?|${longestFirst(Object.keys(words))})\\b`

/** The value of a phrase matched by `numberSource`, or `null`. */
export function parseNumber(phrase: string): number | null {
  const text = phrase.trim()
  if (/^\d+$/.test(text)) return Number(text)
  const compound = /^(\w+)(?:\s+y\s+(\w+))?$/.exec(text)
  if (!compound?.[1]) return null
  const [, head, tail] = compound
  if (head in tens) {
    const unit = tail ? words[tail] : 0
    return unit !== undefined && unit < 10 ? (tens[head] ?? 0) + unit : null
  }
  return tail ? null : (words[head] ?? null)
}
