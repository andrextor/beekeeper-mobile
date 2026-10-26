import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, Text } from 'react-native'

import { cx } from '@/lib/cx'
import { color, iconSize } from '@/lib/theme'

type Variant = 'primary' | 'accent' | 'secondary' | 'danger'

const box: Record<Variant, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  secondary: 'bg-surface border-2 border-border',
  danger: 'bg-danger',
}
const text: Record<Variant, string> = {
  primary: 'text-on-primary',
  accent: 'text-on-accent',
  secondary: 'text-text',
  danger: 'text-on-danger',
}
const ink: Record<Variant, string> = {
  primary: color.onPrimary,
  accent: color.onAccent,
  secondary: color.text,
  danger: color.onDanger,
}

type Props = {
  label: string
  onPress: () => void
  variant?: Variant
  icon?: LucideIcon
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  loading = false,
  className,
}: Props) {
  const inactive = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={cx(
        'min-h-target flex-row items-center justify-center gap-2 rounded-button px-5 active:opacity-80',
        box[variant],
        inactive && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={ink[variant]} />
      ) : (
        Icon && <Icon color={ink[variant]} size={iconSize.standard} />
      )}
      <Text className={cx('font-sans-semibold text-body', text[variant])}>{label}</Text>
    </Pressable>
  )
}
