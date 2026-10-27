import type { ReactNode } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SectionTitle } from './SectionTitle'

type Props = {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet on the native Modal; tapping outside or the back button closes it. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="absolute inset-0 bg-deep/50"
        />
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="gap-4 rounded-t-sheet bg-bg-soft px-4 pt-3"
        >
          <View className="h-1.5 w-12 self-center rounded-full bg-stone-300" />
          <SectionTitle text={title} />
          {children}
        </View>
      </View>
    </Modal>
  )
}
