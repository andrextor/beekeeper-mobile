import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { cx } from '@/lib/cx'

type Props = {
  children: ReactNode
  /** Lists render their own FlatList; everything else scrolls here. */
  scroll?: boolean
  /** Field mode uses pure white for maximum contrast. */
  field?: boolean
}

export function Screen({ children, scroll = true, field = false }: Props) {
  const bg = field ? 'bg-bg' : 'bg-bg-soft'
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={cx('flex-1', bg)}>
      {scroll ? (
        <ScrollView
          contentContainerClassName="gap-4 p-4 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-4 p-4">{children}</View>
      )}
    </SafeAreaView>
  )
}
