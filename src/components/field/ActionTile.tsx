import type { LucideIcon } from 'lucide-react-native'
import { Pressable, Text } from 'react-native'

import { cx } from '@/lib/cx'
import { tapHaptic } from '@/lib/haptics'
import { color, iconSize, iconStroke } from '@/lib/theme'

export type FieldAction = {
  icon: LucideIcon
  label: string
  onPress: () => void
  /** "Terminar" stands apart from the honey tiles. */
  primary?: boolean
}

export function ActionTile({ icon: Icon, label, onPress, primary = false }: FieldAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tapHaptic()
        onPress()
      }}
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
    </Pressable>
  )
}
