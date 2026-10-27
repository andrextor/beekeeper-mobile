import { CircleCheck, TriangleAlert } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cx } from '@/lib/cx'
import { color, shadow } from '@/lib/theme'

type Props = {
  message: string | null
  tone?: 'success' | 'danger'
  /** Shown as "Deshacer"; mid-inspection this replaces confirmation dialogs. */
  onUndo?: () => void
  onHide: () => void
  durationMs?: number
  /** Extra space above the bottom inset, e.g. to clear the tab bar. */
  bottomOffset?: number
}

/** Controlled: render it with a message to show it; it calls onHide after durationMs. */
export function Toast({
  message,
  tone = 'success',
  onUndo,
  onHide,
  durationMs = 3000,
  bottomOffset = 16,
}: Props) {
  const insets = useSafeAreaInsets()
  const reduceMotion = useReducedMotion()
  const hide = useRef(onHide)
  hide.current = onHide

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => hide.current(), durationMs)
    return () => clearTimeout(timer)
  }, [message, durationMs])

  if (!message) return null
  const Icon = tone === 'success' ? CircleCheck : TriangleAlert

  return (
    <Animated.View
      key={message}
      entering={reduceMotion ? undefined : FadeInDown.springify().damping(18)}
      exiting={reduceMotion ? undefined : FadeOutDown.duration(150)}
      accessibilityLiveRegion="polite"
      style={[{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + bottomOffset }]}
    >
      <View
        style={shadow.raised}
        className={cx(
          'min-h-target flex-row items-center gap-3 rounded-[18px] py-2 pr-2 pl-4',
          tone === 'success' ? 'bg-deep' : 'bg-danger',
        )}
      >
        <Icon color={tone === 'success' ? color.sprout : color.onDanger} size={24} />
        <Text className="flex-1 font-sans-semibold text-body text-white">{message}</Text>
        {onUndo && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onUndo()
              onHide()
            }}
            className="min-h-target justify-center rounded-button px-4 active:opacity-70"
          >
            <Text
              className={cx(
                'font-sans-bold text-body',
                tone === 'success' ? 'text-honey' : 'text-white underline',
              )}
            >
              Deshacer
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  )
}
