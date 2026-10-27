import { CircleAlert, CircleCheck, type LucideIcon, TriangleAlert } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

type Tone = 'danger' | 'accent' | 'primary'

const look: Record<Tone, { icon: LucideIcon; box: string; text: string; ink: string }> = {
  danger: {
    icon: CircleAlert,
    box: 'bg-danger-soft',
    text: 'text-on-danger-soft',
    ink: color.danger,
  },
  accent: { icon: TriangleAlert, box: 'bg-accent-soft', text: 'text-text', ink: color.text },
  primary: {
    icon: CircleCheck,
    box: 'bg-primary-soft',
    text: 'text-on-primary-soft',
    ink: color.onPrimarySoft,
  },
}

/** A tinted callout under a form, read aloud by TalkBack; renders nothing without a message. */
export function FormError({
  message,
  tone = 'danger',
}: {
  message: string | null | undefined
  tone?: Tone
}) {
  if (!message) return null
  const { icon: Icon, box, text, ink } = look[tone]
  return (
    <View
      accessibilityRole="alert"
      className={cx('flex-row items-start gap-3 rounded-field px-4 py-3.5', box)}
    >
      <Icon color={ink} size={22} strokeWidth={2.25} />
      <Text className={cx('flex-1 font-sans-semibold text-body', text)}>{message}</Text>
    </View>
  )
}
