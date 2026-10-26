import { View } from 'react-native'

import { cx } from '@/lib/cx'
import type { QueenColor } from './queen-color'

const dots: Readonly<Record<QueenColor, string>> = {
  white: 'bg-queen-white',
  yellow: 'bg-queen-yellow',
  red: 'bg-queen-red',
  green: 'bg-queen-green',
  blue: 'bg-queen-blue',
}

/** The queen's mark colour; always shown next to its name (colour never carries meaning alone). */
export function QueenDot({ color, size = 'small' }: { color: string; size?: 'small' | 'large' }) {
  const dot = Object.hasOwn(dots, color) ? dots[color as QueenColor] : null
  if (!dot) return null
  return (
    <View
      className={cx(
        'rounded-full border-2 border-stone-700',
        size === 'small' ? 'size-4' : 'size-10',
        dot,
      )}
    />
  )
}
