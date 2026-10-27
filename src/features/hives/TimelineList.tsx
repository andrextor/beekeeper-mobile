import { router } from 'expo-router'
import { ClipboardList, Info } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { color, iconSize } from '@/lib/theme'
import { TimelineItemView } from './TimelineItemView'
import type { Timeline } from './useTimeline'

/** History, newest first; "Cargar más" instead of infinite scroll (gloves, bounded work). */
export function TimelineList({
  timeline,
  canEditEvent,
}: {
  timeline: Timeline
  /** Author or owner (B4): only then does an event open its form. */
  canEditEvent: (createdBy: string) => boolean
}) {
  return (
    <View className="gap-3">
      <SectionTitle text="Historial" />
      {timeline.notice ? (
        <View className="flex-row items-center gap-2 rounded-card bg-stone-100 p-3">
          <Info color={color.text} size={iconSize.standard} />
          <Text className="flex-1 font-sans text-caption text-text">{timeline.notice}</Text>
        </View>
      ) : null}
      {!timeline.loading && timeline.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin revisiones ni eventos todavía." />
      ) : null}
      {timeline.items.map((item) => (
        <TimelineItemView
          key={item.id}
          item={item}
          onOpen={
            item.remote
              ? null
              : item.kind === 'inspection'
                ? () => router.push({ pathname: '/inspection/[id]', params: { id: item.id } })
                : // A label change (M5) is history only.
                  item.event.type !== 'qr_relabel' && canEditEvent(item.createdBy)
                  ? () =>
                      router.push({
                        pathname: '/hive/[id]/event/[eventId]',
                        params: { id: item.event.hive_id, eventId: item.id },
                      })
                  : null
          }
        />
      ))}
      {timeline.hasMore ? (
        <Button variant="secondary" label="Cargar más" onPress={timeline.loadMore} />
      ) : null}
    </View>
  )
}
