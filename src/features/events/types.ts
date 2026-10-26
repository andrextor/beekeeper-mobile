import {
  Combine,
  Crown,
  Droplet,
  type LucideIcon,
  Package,
  Skull,
  Split,
  StickyNote,
  Syringe,
  Truck,
  Wind,
} from 'lucide-react-native'

import type { EventType } from './schemas'

// DESIGN.md domain glyphs where it names one; the closest Lucide icon otherwise.
export const eventIcons: Record<EventType, LucideIcon> = {
  note: StickyNote,
  feeding: Droplet,
  treatment: Syringe,
  queen_change: Crown,
  harvest: Package,
  split: Split,
  merge: Combine,
  transfer: Truck,
  swarm: Wind,
  loss: Skull,
}

/** Types whose owner form changes the hive; a reviewer's shows "Avisa al propietario…". */
export const withHiveEffect: ReadonlySet<EventType> = new Set([
  'queen_change',
  'transfer',
  'loss',
  'merge',
  'split',
  'swarm',
])
