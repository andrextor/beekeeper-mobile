import { MapPin } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { formatLastInspection, plural } from '@/lib/format'
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
    <Card onPress={onPress} className="min-h-target flex-row items-center gap-3">
      <IconTile icon={MapPin} />
      <View className="flex-1 gap-1">
        <Text className="font-display text-section text-text">{apiary.name}</Text>
        {where ? <Text className="font-sans text-caption text-muted">{where}</Text> : null}
        <Text className="font-sans text-caption text-muted">
          {`${plural(apiary.active_hives, 'colmena activa', 'colmenas activas')} · ${formatLastInspection(apiary.last_inspection)}`}
        </Text>
      </View>
    </Card>
  )
}
