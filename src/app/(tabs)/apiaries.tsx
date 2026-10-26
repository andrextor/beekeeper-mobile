import { MapPin } from 'lucide-react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'

export default function ApiariesScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        icon={MapPin}
        title="Apiarios"
        body="Tus apiarios y sus colmenas aparecen aquí."
      />
    </Screen>
  )
}
