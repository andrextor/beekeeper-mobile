import { router } from 'expo-router'
import { ClipboardList, Info } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { color, iconSize } from '@/lib/theme'
import { TimelineItemView } from './TimelineItemView'
import type { Timeline } from './useTimeline'

/** History, newest first; "Cargar más" instead of infinite scroll (gloves, bounded work). */
export function TimelineList({ timeline }: { timeline: Timeline }) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-display text-section text-text">
        Historial
      </Text>
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
          onOpen={() => router.push({ pathname: '/inspection/[id]', params: { id: item.id } })}
        />
      ))}
      {timeline.hasMore ? (
        <Button variant="secondary" label="Cargar más" onPress={timeline.loadMore} />
      ) : null}
    </View>
  )
}
