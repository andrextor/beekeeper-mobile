// Ported from beekeeper admin/src/lib/event-summary.ts: the phone and the panel read the same line.
import { formatCalendarDate, formatNumber, plural } from './format'
import { isRecord } from './guards'
import {
  eventTypeLabels,
  feedLabels,
  harvestProductLabels,
  label,
  lossCauseLabels,
  queenChangeReasonLabels,
  queenColorLabels,
  queenOriginLabels,
  treatmentMethodLabels,
} from './labels'

type Details = Record<string, unknown>

function text(details: Details, key: string): string | undefined {
  const value = details[key]
  return typeof value === 'string' && value !== '' ? value : undefined
}

function count(details: Details, key: string): number | undefined {
  const value = details[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function labelled(map: Readonly<Record<string, string>>, value: string | undefined) {
  return value && label(map, value)
}

// Ids in split, merge, transfer and swarm are not resolved to names: that would cost one read per event.
const summaries: Record<string, (details: Details) => Array<string | false | undefined>> = {
  note: (details) => [text(details, 'text')],
  feeding: (details) => {
    const amount = count(details, 'amount')
    const feed = labelled(feedLabels, text(details, 'feed'))
    return [
      [feed, text(details, 'ratio')].filter(Boolean).join(' ') || undefined,
      amount !== undefined &&
        [formatNumber(amount), text(details, 'unit')].filter(Boolean).join(' '),
    ]
  },
  treatment: (details) => {
    const withdrawal = count(details, 'withdrawal_days')
    const endsOn = text(details, 'ends_on')
    return [
      text(details, 'product'),
      text(details, 'dose'),
      labelled(treatmentMethodLabels, text(details, 'method')),
      withdrawal !== undefined && `Retiro: ${plural(withdrawal, 'día', 'días')}`,
      endsOn && `Hasta el ${formatCalendarDate(endsOn)}`,
    ]
  },
  queen_change: (details) => {
    const year = count(details, 'queen_year')
    return [
      year !== undefined && `Reina ${year}`,
      labelled(queenColorLabels, text(details, 'queen_color')),
      labelled(queenOriginLabels, text(details, 'queen_origin')),
      labelled(queenChangeReasonLabels, text(details, 'reason')),
    ]
  },
  harvest: (details) => {
    const kg = count(details, 'kg')
    const supers = count(details, 'supers_taken')
    return [
      labelled(harvestProductLabels, text(details, 'product')),
      kg !== undefined && `${formatNumber(kg)} kg`,
      supers !== undefined && plural(supers, 'alza', 'alzas'),
    ]
  },
  swarm: (details) =>
    typeof details.captured === 'boolean' ? [details.captured ? 'Capturado' : 'No capturado'] : [],
  loss: (details) => [labelled(lossCauseLabels, text(details, 'cause'))],
  qr_relabel: (details) => {
    const from = text(details, 'old_qr_code')
    const to = text(details, 'new_qr_code')
    return [from && to && `${from} → ${to}`]
  },
}

/** "Alimentación · Jarabe de azúcar 1:1 · 2 l"; unknown keys are ignored, an unknown type reads "Evento". */
export function eventSummary(type: string, details: unknown): string {
  if (!Object.hasOwn(eventTypeLabels, type)) return 'Evento'
  const title = label(eventTypeLabels, type)
  const record: Details = isRecord(details) ? details : {}
  const parts = Object.hasOwn(summaries, type) ? (summaries[type]?.(record) ?? []) : []
  return [
    title,
    ...parts.filter((part): part is string => typeof part === 'string' && part !== ''),
  ].join(' · ')
}
