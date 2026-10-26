import * as Updates from 'expo-updates'
import { Download, RefreshCw } from 'lucide-react-native'
import { Linking, Text } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useUpdateChecks } from './useUpdateChecks'

/** Non-blocking; lives on Inicio, so it never shows during an inspection. */
export function UpdateBanner() {
  const { otaReady, newApk } = useUpdateChecks()

  if (newApk) {
    return (
      <Card className="gap-3">
        <Text className="font-sans-semibold text-body text-text">
          Hay una nueva versión de la app.
        </Text>
        <Button
          variant="accent"
          icon={Download}
          label="Descargar"
          onPress={() => void Linking.openURL(newApk.apkUrl)}
        />
      </Card>
    )
  }
  if (!otaReady) return null
  return (
    <Card className="gap-3">
      <Text className="font-sans-semibold text-body text-text">Hay una actualización.</Text>
      <Button
        variant="accent"
        icon={RefreshCw}
        label="Reiniciar ahora"
        onPress={() => void Updates.reloadAsync()}
      />
    </Card>
  )
}
