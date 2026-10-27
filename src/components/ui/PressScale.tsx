import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

import { cx } from '@/lib/cx'

type Props = Omit<PressableProps, 'style'> & {
  className?: string
  style?: StyleProp<ViewStyle>
}

/**
 * A Pressable that sinks to 97 % under the finger. Plain NativeWind `active:` classes: a
 * Reanimated wrapper lost every className on Android (the button showed bare text). The classes
 * stay while disabled (a disabled Pressable never goes active): adding them on enable made
 * css-interop remount the button, and its dev warning crashed on a LinkingContext getter.
 */
export function PressScale({ className, ...props }: Props) {
  return <Pressable className={cx(className, 'active:scale-[0.97] active:opacity-90')} {...props} />
}
