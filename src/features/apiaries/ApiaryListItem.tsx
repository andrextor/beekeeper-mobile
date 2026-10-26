import { MapPin } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { formatLastInspection, plural } from '@/lib/format'
import { color, iconSize } from '@/lib/theme'
import type { ApiarySummary } from './queries'

export function ApiaryListItem({
  apiary,
  onPress,
}: {
  apiary: ApiarySummary
  onPress: () => void
}) {
  const where = [apiary.farm_name, apiary.place].filter(Boolean).join(' · ')
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-target flex-row items-center gap-3 rounded-card border border-border bg-surface p-4 active:bg-stone-100"
    >
      <MapPin color={color.primary} size={iconSize.standard} />
      <View className="flex-1 gap-1">
        <Text className="font-display text-section text-text">{apiary.name}</Text>
        {where ? <Text className="font-sans text-caption text-muted">{where}</Text> : null}
        <Text className="font-sans text-caption text-muted">
          {`${plural(apiary.active_hives, 'colmena activa', 'colmenas activas')} · ${formatLastInspection(apiary.last_inspection)}`}
        </Text>
      </View>
    </Pressable>
  )
}
