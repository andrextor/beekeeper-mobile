import type { ReactNode } from 'react'
import { View } from 'react-native'

import { cx } from '@/lib/cx'
import { shadow } from '@/lib/theme'
import { PressScale } from './PressScale'

type Props = {
  children: ReactNode
  className?: string
  /** Makes the whole card a button with the spring press. */
  onPress?: () => void
  accessibilityLabel?: string
}

/** White surface floating on the canvas: a soft shadow instead of a border. */
export function Card({ children, className, onPress, accessibilityLabel }: Props) {
  const classes = cx('rounded-card bg-surface p-4', className)
  if (!onPress) {
    return (
      <View className={classes} style={shadow.card}>
        {children}
      </View>
    )
  }
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={classes}
      style={shadow.card}
    >
      {children}
    </PressScale>
  )
}
