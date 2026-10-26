import type { ServerRow } from '@/db/mapping'

type Hive = ServerRow<'hives'>

export type HivePatch = { hiveId: string; patch: Partial<Hive> }

/** Choices only an owner makes in the form (spec M10 → Effects on the hive). */
export type EffectChoices = {
  lossStatus?: 'dead' | 'absconded' | 'inactive' | null
  markMerged?: boolean
}

/**
 * Which hive updates an event implies. Owners only: B3 lets only them update hives, so a reviewer's
 * event changes nothing (the form says "Avisa al propietario…"). Events stay side-effect free on the
 * server (B4); the app writes these updates next to the event.
 */
export function hiveEffects(
  type: string,
  details: Record<string, unknown>,
  hiveId: string,
  owner: boolean,
  choices: EffectChoices = {},
): HivePatch[] {
  if (!owner) return []
  const text = (key: string) =>
    typeof details[key] === 'string' ? (details[key] as string) : undefined
  switch (type) {
    case 'queen_change': {
      const patch: Partial<Hive> = {}
      if (typeof details.queen_year === 'number') patch.queen_year = details.queen_year
      if (text('queen_color')) {
        patch.queen_color = text('queen_color') ?? null
        patch.queen_marked = true
      }
      if (text('queen_origin')) patch.queen_origin = text('queen_origin') ?? null
      return Object.keys(patch).length ? [{ hiveId, patch }] : []
    }
    case 'transfer': {
      const to = text('to_apiary_id')
      return to ? [{ hiveId, patch: { apiary_id: to } }] : []
    }
    case 'loss':
      return choices.lossStatus ? [{ hiveId, patch: { status: choices.lossStatus } }] : []
    case 'merge': {
      const merged = text('merged_hive_id')
      return merged && choices.markMerged ? [{ hiveId: merged, patch: { status: 'merged' } }] : []
    }
    default:
      return []
  }
}
