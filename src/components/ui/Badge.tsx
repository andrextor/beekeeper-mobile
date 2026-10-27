import type { LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'danger'

const box: Record<BadgeTone, string> = {
  neutral: 'bg-fill',
  primary: 'bg-primary-soft',
  accent: 'bg-accent-soft',
  danger: 'bg-danger',
}
const text: Record<BadgeTone, string> = {
  neutral: 'text-text',
  primary: 'text-on-primary-soft',
  accent: 'text-text',
  danger: 'text-on-danger',
}
const ink: Record<BadgeTone, string> = {
  neutral: color.text,
  primary: color.onPrimarySoft,
  accent: color.text,
  danger: color.onDanger,
}

export function Badge({
  label,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string
  tone?: BadgeTone
  icon?: LucideIcon
}) {
  return (
    <View
      className={cx('flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', box[tone])}
    >
      {Icon && <Icon color={ink[tone]} size={16} strokeWidth={2.25} />}
      <Text className={cx('font-sans-semibold text-caption', text[tone])}>{label}</Text>
    </View>
  )
}
