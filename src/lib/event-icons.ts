import {
  Combine,
  Crown,
  Droplet,
  type LucideIcon,
  Package,
  QrCode,
  Skull,
  Split,
  StickyNote,
  Syringe,
  Truck,
  Wind,
} from 'lucide-react-native'

// DESIGN.md domain glyphs where it names one; the closest Lucide icon otherwise. Picker and history.
export const eventIcons: Readonly<Record<string, LucideIcon>> = {
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
  qr_relabel: QrCode,
}

export const eventIcon = (type: string): LucideIcon => eventIcons[type] ?? StickyNote
