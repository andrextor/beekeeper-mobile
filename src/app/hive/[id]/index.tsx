import { router, useLocalSearchParams } from 'expo-router'
import { ClipboardCheck, Hexagon, Pencil, QrCode } from 'lucide-react-native'
import { Text } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { useRole } from '@/features/auth/session'
import { HiveFacts } from '@/features/hives/HiveFacts'
import { useHive } from '@/features/hives/queries'

export default function HiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const owner = useRole() === 'owner'
  const { hive, loading } = useHive(id)

  if (!hive)
    return loading ? null : <NotAvailable icon={Hexagon} title="Esta colmena ya no existe." />

  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" className="font-display text-title text-text">
        {hive.name}
      </Text>
      <HiveFacts hive={hive} />
      <Button
        variant="secondary"
        icon={QrCode}
        label="Etiqueta QR"
        onPress={() => router.push({ pathname: '/hive/[id]/label', params: { id } })}
      />
      {owner ? (
        <Button
          variant="secondary"
          icon={Pencil}
          label="Editar colmena"
          onPress={() => router.push({ pathname: '/hive/[id]/edit', params: { id } })}
        />
      ) : null}
      {/* M6 replaces this with the timeline. */}
      <EmptyState
        icon={ClipboardCheck}
        title="Historial"
        body="Las revisiones y eventos de esta colmena aparecerán aquí."
      />
    </Screen>
  )
}
