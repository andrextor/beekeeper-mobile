import { House } from 'lucide-react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'

export default function HomeScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        icon={House}
        title="Inicio"
        body="Aquí verás la última actividad y las colmenas que necesitan atención."
      />
    </Screen>
  )
}
