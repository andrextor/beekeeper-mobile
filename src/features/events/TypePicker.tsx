import { ActionGrid } from '@/components/field/ActionGrid'
import { eventIcon } from '@/lib/event-icons'
import { eventTypeLabels, label } from '@/lib/labels'
import type { EventType } from './schemas'

/** 96-dp tiles, two per row, like field mode's actions. */
export function TypePicker({
  types,
  onPick,
}: {
  types: readonly EventType[]
  onPick: (type: EventType) => void
}) {
  return (
    <ActionGrid
      actions={types.map((type) => ({
        icon: eventIcon(type),
        label: label(eventTypeLabels, type),
        onPress: () => onPick(type),
      }))}
    />
  )
}
