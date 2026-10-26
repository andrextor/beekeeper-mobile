import type { ReactNode } from 'react'
import { View } from 'react-native'

import { cx } from '@/lib/cx'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cx('rounded-card border border-border bg-surface p-4', className)}>
      {children}
    </View>
  )
}
