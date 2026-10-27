import { CircleCheck, TriangleAlert } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

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
    <View
      accessibilityLiveRegion="polite"
      style={{ bottom: insets.bottom + bottomOffset }}
      className={cx(
        'absolute right-4 left-4 min-h-target flex-row items-center gap-3 rounded-card py-2 pr-2 pl-4 shadow-lg',
        tone === 'success' ? 'border border-primary bg-primary-soft' : 'bg-danger',
      )}
    >
      <Icon color={tone === 'success' ? color.primary : color.onDanger} size={24} />
      <Text
        className={cx(
          'flex-1 font-sans-semibold text-body',
          tone === 'success' ? 'text-text' : 'text-on-danger',
        )}
      >
        {message}
      </Text>
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
              'font-sans-bold text-body underline',
              tone === 'success' ? 'text-primary' : 'text-on-danger',
            )}
          >
            Deshacer
          </Text>
        </Pressable>
      )}
    </View>
  )
}
