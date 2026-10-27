import { cssInterop } from 'nativewind'
import type { ComponentProps } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const AnimatedPressable = cssInterop(Animated.createAnimatedComponent(Pressable), {
  className: 'style',
})

type Props = Omit<ComponentProps<typeof AnimatedPressable>, 'style'> & {
  /** Static style only (e.g. `shadow.card`); the press scale is added on top. */
  style?: StyleProp<ViewStyle>
}

const spring = { damping: 18, stiffness: 420, mass: 0.6 }

/** A Pressable that sinks to 97 % under the finger and springs back (UI thread, Reanimated). */
export function PressScale({ onPressIn, onPressOut, disabled, style, ...props }: Props) {
  const reduceMotion = useReducedMotion()
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const to = (value: number) => {
    if (!reduceMotion && !disabled) scale.value = withSpring(value, spring)
  }
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        to(0.97)
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        to(1)
        onPressOut?.(e)
      }}
      style={[style, animated]}
      {...props}
    />
  )
}
