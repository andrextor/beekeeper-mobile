import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cx } from '@/lib/cx'

type Props = {
  children: ReactNode
  /** Lists render their own FlatList; everything else scrolls here. */
  scroll?: boolean
  /** Field mode uses pure white for maximum contrast. */
  field?: boolean
  /** False under a header that already pads the status bar (FieldHeader). */
  topInset?: boolean
}

export function Screen({ children, scroll = true, field = false, topInset = true }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={{ paddingTop: topInset ? insets.top : 0 }}
      className={cx('flex-1', field ? 'bg-bg' : 'bg-bg-soft')}
    >
      {scroll ? (
        <ScrollView contentContainerClassName="gap-4 p-4 pb-8" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-4 p-4">{children}</View>
      )}
    </View>
  )
}
