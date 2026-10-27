import { router, useLocalSearchParams } from 'expo-router'
import { MapPin, Navigation, Pencil, Plus, Printer } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Linking, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ChipSelect } from '@/components/field/ChipSelect'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { Honeycomb } from '@/components/ui/icons'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { ApiaryFacts, mapUrl } from '@/features/apiaries/ApiaryFacts'
import { useApiary } from '@/features/apiaries/queries'
import { useRole } from '@/features/auth/session'
import { HiveListItem } from '@/features/hives/HiveListItem'
import { useHives } from '@/features/hives/queries'
import { apiaryLabels } from '@/features/qr/apiary-labels'
import { sheetHtml } from '@/features/qr/label-html'
import { shareLabelsPdf } from '@/features/qr/print'
import { messageFor } from '@/lib/errors'
import { color } from '@/lib/theme'

const filters = { active: 'Activas', all: 'Todas' } as const

export default function ApiaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const owner = useRole() === 'owner'
  const { apiary, loading } = useApiary(id)
  const [all, setAll] = useState(false)
  const hives = useHives(id, all)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)

  if (!apiary)
    return loading ? null : <NotAvailable icon={MapPin} title="Este apiario ya no existe." />

  const printAll = async () => {
    setPrinting(true)
    setPrintError(null)
    try {
      const labels = await apiaryLabels(id)
      if (labels.length === 0) return setPrintError('Este apiario todavía no tiene colmenas.')
      await shareLabelsPdf(sheetHtml(labels), `Etiquetas ${apiary.name}`)
    } catch (e) {
      setPrintError(messageFor(e))
    } finally {
      setPrinting(false)
    }
  }

  const map = mapUrl(apiary)
  const edit = () => router.push({ pathname: '/apiary/[id]/edit', params: { id } })

  return (
    <View className="flex-1 bg-bg-soft" style={{ paddingTop: insets.top }}>
      <FlatList
        data={hives}
        keyExtractor={(hive) => hive.id}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <BackButton />
            <Text accessibilityRole="header" className="font-display text-title text-text">
              {apiary.name}
            </Text>
            <ApiaryFacts apiary={apiary} />
            {map ? (
              <Button
                variant="secondary"
                icon={Navigation}
                label="Ver en mapa"
                onPress={() => void Linking.openURL(map)}
              />
            ) : owner ? (
              <Button variant="secondary" icon={MapPin} label="Agregar ubicación" onPress={edit} />
            ) : null}
            {owner ? (
              <>
                <Button
                  variant="accent"
                  icon={Plus}
                  label="Nueva colmena"
                  onPress={() => router.push({ pathname: '/hive/new', params: { apiaryId: id } })}
                />
                <Button variant="secondary" icon={Pencil} label="Editar apiario" onPress={edit} />
              </>
            ) : null}
            <Button
              variant="secondary"
              icon={Printer}
              label="Imprimir etiquetas"
              loading={printing}
              onPress={printAll}
            />
            <FormError message={printError} />
            <ChipSelect
              label="Colmenas"
              options={filters}
              value={[all ? 'all' : 'active']}
              onChange={(value) => setAll(value[0] === 'all')}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={Honeycomb}
            title={all ? 'Este apiario no tiene colmenas.' : 'No hay colmenas activas.'}
          />
        }
        renderItem={({ item }) => (
          <HiveListItem
            hive={item}
            onPress={() => router.push({ pathname: '/hive/[id]', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        style={{ backgroundColor: color.bgSoft }}
      />
    </View>
  )
}
