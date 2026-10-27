import { router, useLocalSearchParams } from 'expo-router'
import { Printer, RefreshCw, Share2 } from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { Honeycomb } from '@/components/ui/icons'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { Title } from '@/components/ui/Title'
import { useRole } from '@/features/auth/session'
import { useHive } from '@/features/hives/queries'
import { singleLabelHtml } from '@/features/qr/label-html'
import { printLabels, shareLabelsPdf } from '@/features/qr/print'
import { QrImage } from '@/features/qr/QrImage'
import { messageFor } from '@/lib/errors'
import { groupedQrCode } from '@/lib/qr-code'

/** The hive's label: preview, PDF to share, print; owners can change it (damaged label). */
export default function HiveLabelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const owner = useRole() === 'owner'
  const { hive, loading } = useHive(id)
  const [busy, setBusy] = useState<'share' | 'print' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!hive)
    return loading ? null : <NotAvailable icon={Honeycomb} title="Esta colmena ya no existe." />

  const run = async (kind: 'share' | 'print') => {
    setBusy(kind)
    setError(null)
    try {
      const page = singleLabelHtml(hive)
      if (kind === 'share') await shareLabelsPdf(page, `Etiqueta ${hive.name}`)
      else await printLabels(page)
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Screen>
      <BackButton />
      <Title text="Etiqueta QR" />
      <Card className="items-center gap-3">
        <Text className="font-display text-title text-text">{hive.name}</Text>
        <View className="rounded-card bg-white p-2">
          <QrImage code={hive.qr_code} size={240} />
        </View>
        <Text className="font-mono text-code text-text">{groupedQrCode(hive.qr_code)}</Text>
        <Text className="font-sans text-caption text-muted">
          Sin ubicación ni datos de la finca: solo el nombre y el código.
        </Text>
      </Card>
      <FormError message={error} />
      <Button
        icon={Share2}
        label="Compartir PDF"
        loading={busy === 'share'}
        disabled={busy !== null}
        onPress={() => void run('share')}
      />
      <Button
        variant="secondary"
        icon={Printer}
        label="Imprimir"
        loading={busy === 'print'}
        disabled={busy !== null}
        onPress={() => void run('print')}
      />
      {owner ? (
        <Button
          variant="secondary"
          icon={RefreshCw}
          label="Cambiar etiqueta"
          onPress={() => router.push({ pathname: '/hive/[id]/relabel', params: { id } })}
        />
      ) : null}
    </Screen>
  )
}
