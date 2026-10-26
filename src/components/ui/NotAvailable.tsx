import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BackButton } from './BackButton'
import { EmptyState } from './EmptyState'

/** A record that is gone (deleted, or its finca lost) or a screen this role cannot use. */
export function NotAvailable({ icon, title }: { icon: LucideIcon; title: string }) {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 gap-4 bg-bg-soft p-4" style={{ paddingTop: insets.top + 16 }}>
      <BackButton />
      <EmptyState icon={icon} title={title} />
    </View>
  )
}
