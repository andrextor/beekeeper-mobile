import { CloudCheck } from 'lucide-react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'

export default function PendingScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        icon={CloudCheck}
        title="Sin pendientes"
        body="Lo que guardes sin señal espera aquí hasta sincronizarse."
      />
    </Screen>
  )
}
