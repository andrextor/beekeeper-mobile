import { cssInterop } from 'nativewind'
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const AnimatedPressable = cssInterop(Animated.createAnimatedComponent(Pressable), {
  className: 'style',
})

// Typed from Pressable: the animated component's own props also accept shared values.
type Props = Omit<PressableProps, 'style'> & {
  className?: string
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
