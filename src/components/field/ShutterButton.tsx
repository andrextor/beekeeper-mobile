import { Pressable, View } from 'react-native'

import { cx } from '@/lib/cx'
import { tapHaptic } from '@/lib/haptics'

export function ShutterButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tomar foto"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tapHaptic()
        onPress()
      }}
      className={cx(
        'size-tile items-center justify-center self-center rounded-full border-4 border-white bg-deep/30 active:opacity-80',
        disabled && 'opacity-40',
      )}
    >
      <View className="size-20 rounded-full bg-white" />
    </Pressable>
  )
}
