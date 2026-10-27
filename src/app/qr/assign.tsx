import { router, useLocalSearchParams } from 'expo-router'
import { Lock } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { Honeycomb } from '@/components/ui/icons'
import { ListItem } from '@/components/ui/ListItem'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Sheet } from '@/components/ui/Sheet'
import { Title } from '@/components/ui/Title'
import { showToast } from '@/components/ui/ToastHost'
import { useRole, useSession } from '@/features/auth/session'
import { type FincaHive, useFincaHives } from '@/features/hives/queries'
import { assignCode } from '@/features/qr/assign-code'
import { messageFor } from '@/lib/errors'
import { groupedQrCode, parseQrPayload } from '@/lib/qr-code'
import { color } from '@/lib/theme'

/** An unassigned label → a hive of the active finca (its old label stops working). */
export default function AssignCodeScreen() {
  const params = useLocalSearchParams<{ code?: string }>()
  const code = parseQrPayload(params.code ?? '')
  const insets = useSafeAreaInsets()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const hives = useFincaHives(state.status === 'signedIn' ? (state.activeOrganizationId ?? '') : '')
  const [chosen, setChosen] = useState<FincaHive | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!owner)
    return <NotAvailable icon={Lock} title="Solo el propietario puede asignar etiquetas." />
  if (!code) return <NotAvailable icon={Honeycomb} title="Ese código no es válido." />

  const assign = async (hive: FincaHive, code: string) => {
    setSaving(true)
    setError(null)
    try {
      const refused = await assignCode(hive.id, code)
      if (refused) return setError(refused)
      setChosen(null)
      showToast(`Etiqueta asignada a ${hive.name}. Guardado en este dispositivo`)
      router.replace({ pathname: '/hive/[id]', params: { id: hive.id } })
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="flex-1 bg-bg-soft" style={{ paddingTop: insets.top }}>
      <FlatList
        data={hives}
        keyExtractor={(hive) => hive.id}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <BackButton />
            <Title text="Asignar etiqueta" />
            <Text className="font-sans text-body text-text">
              {`Elige la colmena que llevará el código ${groupedQrCode(code)}.`}
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon={Honeycomb} title="Tu finca aún no tiene colmenas." />}
        renderItem={({ item }) => (
          <ListItem
            icon={Honeycomb}
            title={item.name}
            subtitle={item.apiary_name ?? undefined}
            onPress={() => setChosen(item)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        style={{ backgroundColor: color.bgSoft }}
      />
      <Sheet
        visible={chosen !== null}
        title={chosen ? `¿Poner esta etiqueta a ${chosen.name}?` : ''}
        onClose={() => setChosen(null)}
      >
        <Text className="font-sans text-body text-text">
          Su etiqueta anterior dejará de funcionar. El historial anota el cambio.
        </Text>
        <FormError message={error} />
        <Button
          label="Asignar etiqueta"
          loading={saving}
          onPress={() => chosen && void assign(chosen, code)}
        />
        <Button variant="ghost" label="Cancelar" onPress={() => setChosen(null)} />
      </Sheet>
    </View>
  )
}
