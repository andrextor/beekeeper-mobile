import { router, useLocalSearchParams } from 'expo-router'
import { Hexagon, Lock, ScanQrCode, Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { showToast } from '@/components/ui/ToastHost'
import { useRole } from '@/features/auth/session'
import { useHive } from '@/features/hives/queries'
import { assignCode } from '@/features/qr/assign-code'
import { ScannerView } from '@/features/qr/ScannerView'
import { messageFor } from '@/lib/errors'
import { newQrCode } from '@/lib/qr-code'

/** Owner only: a damaged label is replaced by a pre-printed one (scan it) or a new code to print. */
export default function RelabelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const owner = useRole() === 'owner'
  const { hive, loading } = useHive(id)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!owner)
    return <NotAvailable icon={Lock} title="Solo el propietario puede cambiar la etiqueta." />
  if (!hive)
    return loading ? null : <NotAvailable icon={Hexagon} title="Esta colmena ya no existe." />

  const apply = async (code: string) => {
    setScanning(false)
    setSaving(true)
    setError(null)
    try {
      const refused = await assignCode(id, code)
      if (refused) return setError(refused)
      showToast('Etiqueta cambiada. Guardado en este dispositivo')
      router.replace({ pathname: '/hive/[id]/label', params: { id } })
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setSaving(false)
    }
  }

  if (scanning) {
    return (
      <View className="flex-1">
        <ScannerView onCode={(code) => void apply(code)} />
        <View className="absolute top-12 left-4">
          <BackButton onPress={() => setScanning(false)} />
        </View>
      </View>
    )
  }

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" className="font-display text-title text-text">
        {`Cambiar etiqueta de ${hive.name}`}
      </Text>
      <Text className="font-sans text-body text-text">
        La etiqueta anterior deja de funcionar. El historial de la colmena se conserva y anota el
        cambio.
      </Text>
      <FormError message={error} />
      <Button
        variant="accent"
        icon={ScanQrCode}
        label="Escanear etiqueta nueva"
        disabled={saving}
        onPress={() => setScanning(true)}
      />
      <Button
        variant="secondary"
        icon={Sparkles}
        label="Generar código nuevo"
        loading={saving}
        onPress={() => void apply(newQrCode())}
      />
    </Screen>
  )
}
