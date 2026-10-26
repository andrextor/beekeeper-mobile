import { ArrowLeft } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { IconButton } from '@/components/ui/IconButton'
import { SyncChip, type SyncState } from '@/components/ui/SyncChip'

type Props = {
  apiaryName: string
  hiveName: string
  /** Already formatted, e.g. "Última revisión hace 12 días". */
  lastInspection: string
  sync: SyncState
  syncCount?: number
  onBack: () => void
}

/** Sticky field-mode header: where am I, when was this hive last seen, is it saved. */
export function FieldHeader({
  apiaryName,
  hiveName,
  lastInspection,
  sync,
  syncCount,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="gap-2 border-b border-border bg-bg px-4 pb-3"
    >
      <View className="flex-row items-center gap-2">
        <IconButton icon={ArrowLeft} label="Volver" onPress={onBack} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-sans-semibold text-caption text-muted">
            {apiaryName}
          </Text>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className="font-display text-title text-text"
          >
            {hiveName}
          </Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-sans text-body text-muted">{lastInspection}</Text>
        <SyncChip state={sync} count={syncCount} />
      </View>
    </View>
  )
}
