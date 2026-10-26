import type { FeedingDetails, Proposal } from '@/features/voice/parser'
import type { InspectionDraft } from './schema'

/** The transcript column holds 10000 characters (B4). */
export const transcriptLimit = 10_000

export type Applied = { fields: InspectionDraft; feedings: FeedingDetails[]; warnings: string[] }

/**
 * Accepted proposals into the draft only (spec M8 → Confirmation): lists gain values, scalars are
 * replaced, `source` becomes voice and the transcript is appended. Nothing is saved here: Terminar does.
 */
export function applyProposals(
  fields: InspectionDraft,
  accepted: readonly Proposal[],
  transcript: string,
): Applied {
  const next: InspectionDraft = { ...fields, source: 'voice' }
  const feedings: FeedingDetails[] = []
  const warnings: string[] = []
  for (const p of accepted) {
    switch (p.field) {
      case 'feeding_event':
        feedings.push(p.value)
        break
      case 'hive_mismatch':
        warnings.push(p.value)
        break
      case 'pests':
      case 'disease_signs':
      case 'planned_actions': {
        const current = next[p.field] ?? []
        if (!current.includes(p.value)) next[p.field] = [...current, p.value]
        break
      }
      case 'attention_level':
        // A task never lowers an urgent visit already recorded.
        if (!(p.value === 'soon' && next.attention_level === 'urgent'))
          next.attention_level = String(p.value)
        break
      default:
        Object.assign(next, { [p.field]: p.value })
    }
  }
  const joined = [fields.transcript, transcript.trim()].filter(Boolean).join('\n')
  next.transcript = joined.slice(0, transcriptLimit)
  return { fields: next, feedings, warnings }
}
