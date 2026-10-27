import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

import { cx } from '@/lib/cx'

type Props = Omit<PressableProps, 'style'> & {
  className?: string
  style?: StyleProp<ViewStyle>
}

/**
 * A Pressable that sinks to 97 % under the finger. Plain NativeWind `active:` classes: a
 * Reanimated wrapper lost every className on Android (the button showed bare text).
 */
export function PressScale({ className, disabled, ...props }: Props) {
  return (
    <Pressable
      disabled={disabled}
      className={cx(className, !disabled && 'active:scale-[0.97] active:opacity-90')}
      {...props}
    />
  )
}
