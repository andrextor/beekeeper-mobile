import { formatCalendarDate, plural } from '@/lib/format'
import { isRecord } from '@/lib/guards'

export type AttentionItem = {
  kind: 'urgent' | 'soon' | 'overdue' | 'due_today' | 'treatment'
  text: string
}

/** Whole days from `from` to `to`, both "YYYY-MM-DD" (calendar days, no time zone involved). */
export function daysBetween(from: string, to: string): number {
  const utc = (day: string) => {
    const [y = 0, m = 1, d = 1] = day.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

type LastInspection = { attention_level: string | null; next_inspection_on: string | null }
type Treatment = { details: unknown }

/** Spec M6 → Attention card: the last inspection's urgency, a due date, active treatments. */
export function hiveAttention(
  last: LastInspection | null,
  treatments: readonly Treatment[],
  today: string,
): AttentionItem[] {
  const items: AttentionItem[] = []
  if (last?.attention_level === 'urgent') items.push({ kind: 'urgent', text: 'Urgente' })
  if (last?.attention_level === 'soon') items.push({ kind: 'soon', text: 'Revisar pronto' })
  if (last?.next_inspection_on) {
    const late = daysBetween(last.next_inspection_on, today)
    if (late > 0) {
      items.push({ kind: 'overdue', text: `Revisión atrasada ${plural(late, 'día', 'días')}` })
    } else if (late === 0) {
      items.push({ kind: 'due_today', text: 'Revisión para hoy' })
    }
  }
  for (const { details } of treatments) {
    if (!isRecord(details) || typeof details.ends_on !== 'string' || details.ends_on < today)
      continue
    const product = typeof details.product === 'string' ? `${details.product} ` : ''
    items.push({
      kind: 'treatment',
      text: `Tratamiento ${product}hasta el ${formatCalendarDate(details.ends_on)}`,
    })
  }
  return items
}
