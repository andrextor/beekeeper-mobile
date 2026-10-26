import { addDays } from '@/lib/dates'
import { fold } from '@/lib/text'
import { numberSource, parseNumber } from './numbers'

/** Inspection columns the parser fills with one value (the last mention wins). */
export type ScalarField =
  | 'queen_seen'
  | 'eggs_seen'
  | 'larvae_seen'
  | 'queen_cells'
  | 'brood_frames'
  | 'honey_frames'
  | 'pollen_frames'
  | 'brood_pattern'
  | 'stores'
  | 'population_strength'
  | 'temperament'
  | 'varroa_count'
  | 'varroa_method'
  | 'weather'
  | 'temperature_c'
  | 'next_inspection_on'
  | 'attention_level'

/** Columns that add values to a list. */
export type ListField = 'pests' | 'disease_signs' | 'planned_actions'

export type FeedingDetails = { feed: string; amount?: number; unit?: 'l' | 'kg' | 'g' }

type Found =
  | { field: ScalarField; value: string | number }
  | { field: ListField; value: string }
  | { field: 'feeding_event'; value: FeedingDetails }
  /** The hive the person named, when it is not the open one: a warning, never a switch. */
  | { field: 'hive_mismatch'; value: string }

export type Proposal = Found & {
  confidence: 'high' | 'medium'
  /** Where the phrase is in the original text (folding keeps positions). */
  span: [number, number]
  phrase: string
}

type Context = { text: string; clauseStart: number; today: string; hiveName: string }
type Made = (Found & { confidence?: 'high' | 'medium' }) | null
type Rule = { re: RegExp; make: (m: RegExpExecArray, at: number, ctx: Context) => Made | Made[] }

const N = numberSource
const negation = /\b(?:no|sin|ningun|ninguna|nada de|falta|faltan)\b/

/** A "no", "sin"… earlier in the same clause negates the keyword. */
const negated = (ctx: Context, at: number) => negation.test(ctx.text.slice(ctx.clauseStart, at))

const fixed =
  (found: Found, confidence: 'high' | 'medium' = 'high'): Rule['make'] =>
  () => ({ ...found, confidence })

const count =
  (field: 'brood_frames' | 'honey_frames' | 'pollen_frames'): Rule['make'] =>
  (m) => {
    const n = parseNumber(m[1] ?? '')
    return n !== null && n <= 40 ? { field, value: n } : null
  }

const varroaMethods: Readonly<Record<string, string>> = {
  lavado: 'alcohol_wash',
  alcohol: 'alcohol_wash',
  azucar: 'sugar_roll',
  lamina: 'sticky_board',
  carton: 'sticky_board',
  bandeja: 'sticky_board',
}

const feeds: [RegExp, string][] = [
  [/jarabe|azucar/, 'sugar_syrup'],
  [/fondant/, 'fondant'],
  [/torta|polen/, 'pollen_patty'],
  [/miel/, 'honey'],
]

const plannedActions: [RegExp, string][] = [
  [/alimentar/, 'feed'],
  [/poner (?:una |otra )?alza/, 'add_super'],
  [/quitar (?:una |la )?alza/, 'remove_super'],
  [/cambiar (?:la )?reina/, 'change_queen'],
  [/tratar/, 'treat'],
  [/cosechar/, 'harvest'],
  [/dividir/, 'split'],
]

const digits = (text: string) => {
  const match = /\d+/.exec(text)
  return match ? Number(match[0]) : null
}

// Order matters: a longer or negative phrase consumes its words before a shorter rule sees them.
const rules: Rule[] = [
  // Queen: not checked and negatives before positives ("no vi la reina" contains "vi la reina").
  {
    re: /\bno revise (?:a )?la reina\b/g,
    make: fixed({ field: 'queen_seen', value: 'not_checked' }),
  },
  {
    re: /\b(?:no se vio la reina|la reina no se vio|no vi (?:a )?la reina|no encontre (?:a )?la reina|sin reina|no hay reina|reina no vista)\b/g,
    make: fixed({ field: 'queen_seen', value: 'no' }),
  },
  {
    re: /\b(?:reina vista|vi (?:a )?la reina|esta la reina|hay reina|encontre (?:a )?la reina)\b/g,
    make: fixed({ field: 'queen_seen', value: 'yes' }),
  },
  // Queen cells: replacement first, then swarm cells (negated: none).
  {
    re: /\b(?:celdas de reemplazo|supersedura)\b/g,
    make: fixed({ field: 'queen_cells', value: 'supersedure' }),
  },
  {
    re: /\b(?:celdas reales|realeras|celdas de enjambrazon)\b/g,
    make: (_m, at, ctx) => ({ field: 'queen_cells', value: negated(ctx, at) ? 'none' : 'swarm' }),
  },
  // Frames.
  {
    re: new RegExp(`(${N})\\s+(?:cuadros|marcos|panales)\\s+de\\s+cria\\b`, 'g'),
    make: count('brood_frames'),
  },
  {
    re: new RegExp(`(${N})\\s+(?:cuadros|marcos|panales)\\s+de\\s+miel\\b`, 'g'),
    make: count('honey_frames'),
  },
  {
    re: new RegExp(`(${N})\\s+(?:cuadros|marcos|panales)\\s+de\\s+polen\\b`, 'g'),
    make: count('pollen_frames'),
  },
  // Brood pattern before eggs ("postura compacta" is a pattern, not just eggs).
  {
    re: /\b(?:cria|postura) compacta\b/g,
    make: fixed({ field: 'brood_pattern', value: 'compact' }),
  },
  {
    re: /\b(?:cria|postura) salt(?:e)?ada\b/g,
    make: fixed({ field: 'brood_pattern', value: 'spotty' }),
  },
  // Signs of disease (observed, not a diagnosis); "cria yesada" before plain eggs/larvae words.
  {
    re: /\b(?:cria (?:yesada|yesificada|momificada))\b/g,
    make: (_m, at, ctx) =>
      negated(ctx, at)
        ? null
        : { field: 'disease_signs', value: 'chalkbrood', confidence: 'medium' },
  },
  {
    re: /\bcria ensacada\b/g,
    make: (_m, at, ctx) =>
      negated(ctx, at) ? null : { field: 'disease_signs', value: 'sacbrood', confidence: 'medium' },
  },
  {
    re: /\b(?:loque|olor a podrido|cria hundida)\b/g,
    make: (_m, at, ctx) =>
      negated(ctx, at)
        ? null
        : { field: 'disease_signs', value: 'foulbrood_signs', confidence: 'medium' },
  },
  {
    re: /\balas (?:deformes|deformadas)\b/g,
    make: (_m, at, ctx) =>
      negated(ctx, at)
        ? null
        : { field: 'disease_signs', value: 'deformed_wings', confidence: 'medium' },
  },
  {
    re: /\b(?:diarrea|disenteria|manchas de excremento)\b/g,
    make: (_m, at, ctx) =>
      negated(ctx, at)
        ? null
        : { field: 'disease_signs', value: 'dysentery', confidence: 'medium' },
  },
  {
    re: /\babejas muertas\b/g,
    make: (_m, at, ctx) =>
      negated(ctx, at)
        ? null
        : { field: 'disease_signs', value: 'dead_bees', confidence: 'medium' },
  },
  // Eggs and larvae.
  {
    re: /\bhuevos?\b/g,
    make: (_m, at, ctx) => ({ field: 'eggs_seen', value: negated(ctx, at) ? 'no' : 'yes' }),
  },
  {
    re: /\b(?:buena )?postura\b/g,
    make: (_m, at, ctx) => ({
      field: 'eggs_seen',
      value: negated(ctx, at) ? 'no' : 'yes',
      confidence: 'medium',
    }),
  },
  {
    re: /\b(?:larvas?|cria abierta)\b/g,
    make: (_m, at, ctx) => ({ field: 'larvae_seen', value: negated(ctx, at) ? 'no' : 'yes' }),
  },
  // Stores.
  {
    re: /\b(?:reservas bajas|pocas reservas|sin reservas|poca miel|poquita miel)\b/g,
    make: fixed({ field: 'stores', value: 'low' }),
  },
  {
    re: /\b(?:muchas reservas|reservas altas|llena de miel|mucha miel)\b/g,
    make: fixed({ field: 'stores', value: 'high' }),
  },
  {
    re: /\breservas (?:buenas|normales|bien|suficientes)\b/g,
    make: fixed({ field: 'stores', value: 'ok' }),
  },
  // Strength: "fuerza 4" is exact; words are a guess.
  {
    re: new RegExp(`\\bfuerza\\s+(${N})`, 'g'),
    make: (m) => {
      const n = parseNumber(m[1] ?? '')
      return n !== null && n >= 1 && n <= 5 ? { field: 'population_strength', value: n } : null
    },
  },
  { re: /\bmuy debil\b/g, make: fixed({ field: 'population_strength', value: 1 }, 'medium') },
  { re: /\bdebil\b/g, make: fixed({ field: 'population_strength', value: 2 }, 'medium') },
  {
    re: /\b(?:colonia|colmena) normal\b/g,
    make: fixed({ field: 'population_strength', value: 3 }, 'medium'),
  },
  { re: /\bmuy fuerte\b/g, make: fixed({ field: 'population_strength', value: 5 }, 'medium') },
  {
    re: /\bfuerte\b/g,
    // "viento fuerte" is weather, not the colony.
    make: (_m, at, ctx) =>
      /viento\s+$/.test(ctx.text.slice(Math.max(0, at - 8), at))
        ? null
        : { field: 'population_strength', value: 4, confidence: 'medium' },
  },
  // Temperament, with M7's scale words.
  {
    re: /\bmuy (?:brava|agresiva|defensiva|picona)\b/g,
    make: fixed({ field: 'temperament', value: 5 }, 'medium'),
  },
  {
    re: /\b(?:brava|agresiva|defensiva|picona)\b/g,
    make: fixed({ field: 'temperament', value: 4 }, 'medium'),
  },
  { re: /\b(?:muy )?mansa\b/g, make: fixed({ field: 'temperament', value: 1 }, 'medium') },
  { re: /\b(?:tranquila|calmada)\b/g, make: fixed({ field: 'temperament', value: 2 }, 'medium') },
  // Pests, added one by one; "no hay escarabajo" adds nothing.
  ...(
    [
      [/\bpolillas?\b/g, 'wax_moth'],
      [/\bescarabajos?\b/g, 'small_hive_beetle'],
      [/\bhormigas?\b/g, 'ants'],
      [/\bavispas?\b/g, 'wasps'],
      [/\b(?:raton|ratones)\b/g, 'mice'],
    ] as const
  ).map(
    ([re, pest]): Rule => ({
      re,
      make: (_m, at, ctx) => (negated(ctx, at) ? null : { field: 'pests', value: pest }),
    }),
  ),
  // Varroa: the count and how it was counted; the sample size is never guessed.
  {
    re: new RegExp(
      `(${N})\\s+varroas?(?:\\s+en\\s+(?:el\\s+|la\\s+)?(lavado|alcohol|azucar|lamina|carton|bandeja))?`,
      'g',
    ),
    make: (m) => {
      const n = parseNumber(m[1] ?? '')
      if (n === null) return null
      const method = m[2] ? varroaMethods[m[2]] : undefined
      return [
        { field: 'varroa_count', value: n },
        method ? { field: 'varroa_method', value: method } : null,
      ]
    },
  },
  // Weather and temperature.
  { re: /\b(?:sol|soleado)\b/g, make: fixed({ field: 'weather', value: 'sunny' }) },
  { re: /\bnublado\b/g, make: fixed({ field: 'weather', value: 'cloudy' }) },
  { re: /\b(?:lluvia|lloviendo|llovizna)\b/g, make: fixed({ field: 'weather', value: 'rain' }) },
  { re: /\b(?:ventoso|viento)\b/g, make: fixed({ field: 'weather', value: 'windy' }) },
  {
    re: new RegExp(`(${N})\\s+grados\\b`, 'g'),
    make: (m) => {
      const n = parseNumber(m[1] ?? '')
      return n !== null && n <= 60 ? { field: 'temperature_c', value: n } : null
    },
  },
  // Next inspection, from today.
  {
    re: new RegExp(`\\ben\\s+(${N})\\s+(dias?|semanas?)\\b`, 'g'),
    make: (m, _at, ctx) => {
      const n = parseNumber(m[1] ?? '')
      if (n === null || n < 1) return null
      const days = m[2]?.startsWith('semana') ? n * 7 : n
      return days <= 90 ? { field: 'next_inspection_on', value: addDays(ctx.today, days) } : null
    },
  },
  {
    re: /\b(?:la )?proxima semana\b/g,
    make: (_m, _at, ctx) => ({ field: 'next_inspection_on', value: addDays(ctx.today, 7) }),
  },
  {
    re: /\ben un mes\b/g,
    make: (_m, _at, ctx) => ({ field: 'next_inspection_on', value: addDays(ctx.today, 30) }),
  },
  // Attention: urgent wins over soon (conflict step).
  {
    re: /\b(?:urgente|grave|emergencia|ya mismo|de inmediato)\b/g,
    make: fixed({ field: 'attention_level', value: 'urgent' }, 'medium'),
  },
  // Feeding done (past tense) proposes an event; feeding to do is a planned action below.
  {
    re: /\b(?:le di|alimente|se alimento)\b[^.,;]*/g,
    make: (m) => {
      const phrase = m[0]
      const feed = feeds.find(([re]) => re.test(phrase))?.[1] ?? 'other'
      const amount = new RegExp(`(${N})\\s+(litros?|kilos?|kg|gramos?)\\b`).exec(phrase)
      const n = amount ? parseNumber(amount[1] ?? '') : null
      const unit = amount?.[2]?.startsWith('l') ? 'l' : amount?.[2]?.startsWith('g') ? 'g' : 'kg'
      return {
        field: 'feeding_event',
        value: n !== null ? { feed, amount: n, unit } : { feed },
        confidence: 'medium',
      }
    },
  },
  ...plannedActions.map(
    ([re, action]): Rule => ({
      re: new RegExp(`\\b(?:hay que |toca |debo |vamos a )?${re.source}\\b`, 'g'),
      make: () => [
        { field: 'planned_actions', value: action, confidence: 'medium' },
        // A task to do means a visit soon, unless something says urgent.
        { field: 'attention_level', value: 'soon', confidence: 'medium' },
      ],
    }),
  ),
  {
    re: /\b(?:pronto|pendiente|hay que)\b/g,
    make: fixed({ field: 'attention_level', value: 'soon' }, 'medium'),
  },
  // "colmena 12" while C-01 is open.
  {
    re: /\bcolmena\s+([a-z]?-?\d+)\b/g,
    make: (m, _at, ctx) => {
      const named = m[1] ?? ''
      const open = fold(ctx.hiveName)
      const same = named === open || (digits(named) !== null && digits(named) === digits(open))
      return same ? null : { field: 'hive_mismatch', value: named }
    },
  },
]

const clauseBreak = /[.,;]|\by luego\b|\btambien\b/g

function clauses(text: string): [number, number][] {
  const ranges: [number, number][] = []
  let start = 0
  for (const m of text.matchAll(clauseBreak)) {
    ranges.push([start, m.index])
    start = m.index + m[0].length
  }
  ranges.push([start, text.length])
  return ranges
}

const overlaps = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1]

const scalar = (p: Proposal): p is Proposal & { field: ScalarField } =>
  !['pests', 'disease_signs', 'planned_actions', 'feeding_event', 'hive_mismatch'].includes(p.field)

/**
 * Spoken Spanish → proposed fields (spec M8 → Parser). Pure and deterministic; nothing is saved
 * from here: every proposal waits for the person to accept it.
 */
export function parseInspection(
  original: string,
  options: { today: string; hiveName: string },
): Proposal[] {
  const text = fold(original)
  const found: Proposal[] = []
  const used: [number, number][] = []
  for (const [clauseStart, clauseEnd] of clauses(text)) {
    const clause = text.slice(clauseStart, clauseEnd)
    const ctx: Context = { text, clauseStart, today: options.today, hiveName: options.hiveName }
    for (const rule of rules) {
      rule.re.lastIndex = 0
      for (const m of clause.matchAll(rule.re)) {
        const span: [number, number] = [clauseStart + m.index, clauseStart + m.index + m[0].length]
        if (used.some((u) => overlaps(u, span))) continue
        const made = [rule.make(m as RegExpExecArray, span[0], ctx)].flat()
        const kept = made.filter((p): p is Found & { confidence?: 'high' | 'medium' } => p !== null)
        if (kept.length === 0) continue
        used.push(span)
        for (const p of kept) {
          found.push({
            ...p,
            confidence: p.confidence ?? 'high',
            span,
            phrase: original.slice(span[0], span[1]),
          } as Proposal)
        }
      }
    }
  }
  return resolve(found.sort((a, b) => a.span[0] - b.span[0]))
}

/** Same field twice: the last mention wins, at medium confidence; urgent beats soon; lists dedupe. */
function resolve(found: Proposal[]): Proposal[] {
  const urgent = found.some((p) => p.field === 'attention_level' && p.value === 'urgent')
  const result: Proposal[] = []
  for (const p of found) {
    if (p.field === 'attention_level' && urgent && p.value !== 'urgent') continue
    if (scalar(p)) {
      const earlier = result.findIndex((r) => r.field === p.field)
      if (earlier >= 0) {
        const repeated = result[earlier]
        result.splice(earlier, 1)
        result.push(repeated?.value === p.value ? p : { ...p, confidence: 'medium' })
        continue
      }
    } else if (
      result.some((r) => r.field === p.field && JSON.stringify(r.value) === JSON.stringify(p.value))
    ) {
      continue
    }
    result.push(p)
  }
  return result
}
