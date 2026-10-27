import { ClipboardCheck } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { SyncChip } from '@/components/ui/SyncChip'
import { eventIcon } from '@/lib/event-icons'
import { eventSummary } from '@/lib/event-summary'
import { formatDateTime } from '@/lib/format'
import { isRecord } from '@/lib/guards'
import { inspectionSummary } from '@/lib/inspection-summary'
import { inspectionSourceLabels, label } from '@/lib/labels'
import type { TimelineItem } from './timeline'

const noteText = (details: unknown) =>
  isRecord(details) && typeof details.text === 'string' ? details.text : ''

/** One row of the history; an inspection opens its full read view. */
export function TimelineItemView({
  item,
  onOpen,
}: {
  item: TimelineItem
  /** `null`: nothing to open (a server item, or an event this person may not edit). */
  onOpen: (() => void) | null
}) {
  const inspection = item.kind === 'inspection'
  const Icon = inspection ? ClipboardCheck : eventIcon(item.event.type)
  const title = inspection
    ? `Revisión · ${label(inspectionSourceLabels, item.inspection.source)}`
    : eventSummary(item.event.type, item.event.details)
  const author = item.author ?? 'Antiguo miembro'

  return (
    <Card onPress={onOpen ?? undefined} className="min-h-target flex-row gap-3">
      <IconTile icon={Icon} tone={inspection ? 'primary' : 'accent'} />
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
    </Card>
  )
}
