import type { LucideIcon } from 'lucide-react-native'
import { Pressable } from 'react-native'

import { cx } from '@/lib/cx'
import { color, iconSize } from '@/lib/theme'

type Props = {
  icon: LucideIcon
  /** Read by TalkBack; required because the button has no text. */
  label: string
  onPress: () => void
  variant?: 'plain' | 'accent'
  disabled?: boolean
}

export function IconButton({ icon: Icon, label, onPress, variant = 'plain', disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={cx(
        'size-target items-center justify-center rounded-button active:opacity-70',
        variant === 'accent' ? 'bg-accent' : 'bg-transparent',
        disabled && 'opacity-50',
      )}
    >
      <Icon color={variant === 'accent' ? color.onAccent : color.text} size={iconSize.standard} />
    </Pressable>
  )
}
