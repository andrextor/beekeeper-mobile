import { Check, type LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { color, iconSize, iconStroke } from '@/lib/theme'

export type FieldAction = {
  icon: LucideIcon
  label: string
  onPress: () => void
  /** "Terminar" stands apart from the honey tiles. */
  primary?: boolean
  /** A filled note slot: check badge and its first words. */
  detail?: string
}

export function ActionTile({ icon: Icon, label, onPress, primary = false, detail }: FieldAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}: ${detail}` : label}
      onPress={withTap(onPress)}
      className={cx(
        'min-h-tile flex-1 items-center justify-center gap-1.5 rounded-card px-2 active:opacity-80',
        primary ? 'bg-primary' : 'bg-accent',
      )}
    >
      <Icon
        color={primary ? color.onPrimary : color.onAccent}
        size={iconSize.field}
        strokeWidth={iconStroke.field}
      />
      <Text
        numberOfLines={1}
        className={cx(
          'font-sans-semibold text-field-label',
          primary ? 'text-on-primary' : 'text-on-accent',
        )}
      >
        {label}
      </Text>
      {detail ? (
        <View className="flex-row items-center gap-1 px-1">
          <Check color={color.onAccent} size={18} strokeWidth={3} />
          <Text numberOfLines={1} className="flex-shrink font-sans text-caption text-on-accent">
            {detail}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}
