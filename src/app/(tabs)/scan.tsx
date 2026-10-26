import { ScanQrCode } from 'lucide-react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'

export default function ScanScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        icon={ScanQrCode}
        title="Escanear"
        body="Apunta la cámara a la etiqueta QR de una colmena para abrir su historia."
      />
    </Screen>
  )
}
