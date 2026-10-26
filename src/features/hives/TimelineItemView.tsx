import {
  ClipboardCheck,
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
import { Pressable, Text, View } from 'react-native'

import { SyncChip } from '@/components/ui/SyncChip'
import { eventSummary } from '@/lib/event-summary'
import { formatDateTime } from '@/lib/format'
import { isRecord } from '@/lib/guards'
import { inspectionSummary } from '@/lib/inspection-summary'
import { inspectionSourceLabels, label } from '@/lib/labels'
import { color, iconSize } from '@/lib/theme'
import type { TimelineItem } from './timeline'

// DESIGN.md domain glyphs; types without one there use the closest Lucide icon.
const eventIcons: Readonly<Record<string, LucideIcon>> = {
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

const noteText = (details: unknown) =>
  isRecord(details) && typeof details.text === 'string' ? details.text : ''

/** One row of the history; an inspection opens its full read view. */
export function TimelineItemView({ item, onOpen }: { item: TimelineItem; onOpen: () => void }) {
  const inspection = item.kind === 'inspection'
  const Icon = inspection ? ClipboardCheck : (eventIcons[item.event.type] ?? StickyNote)
  const title = inspection
    ? `Revisión · ${label(inspectionSourceLabels, item.inspection.source)}`
    : eventSummary(item.event.type, item.event.details)
  const author = item.author ?? 'Antiguo miembro'

  return (
    <Pressable
      accessibilityRole={inspection ? 'button' : undefined}
      disabled={!inspection}
      onPress={onOpen}
      className="min-h-target flex-row gap-3 rounded-card border border-border bg-surface p-4 active:bg-stone-100"
    >
      <Icon color={color.text} size={iconSize.standard} />
      <View className="flex-1 gap-1">
        <Text className="font-sans-semibold text-body text-text" numberOfLines={inspection ? 1 : 2}>
          {title}
        </Text>
        {inspection ? (
          <Text className="font-sans text-body text-text">
            {inspectionSummary(item.inspection)}
          </Text>
        ) : null}
        {inspection
          ? item.notes.map((note) => (
              <Text key={note.id} className="font-sans text-caption text-muted" numberOfLines={2}>
                {`Nota: ${noteText(note.details)}`}
              </Text>
            ))
          : null}
        <Text className="font-sans text-caption text-muted">
          {`${formatDateTime(item.at)} · ${author}`}
        </Text>
        {item.sync === 'pending' ? <SyncChip state="pending" /> : null}
        {item.sync === 'attention' ? <SyncChip state="attention" /> : null}
      </View>
    </Pressable>
  )
}
