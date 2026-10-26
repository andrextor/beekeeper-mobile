import { router } from 'expo-router'
import { MapPin, Plus, SearchX } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextField } from '@/components/ui/TextField'
import { ApiaryListItem } from '@/features/apiaries/ApiaryListItem'
import { useApiaries } from '@/features/apiaries/queries'
import { useRole, useSession } from '@/features/auth/session'
import { fold } from '@/lib/text'
import { color } from '@/lib/theme'

export default function ApiariesScreen() {
  const insets = useSafeAreaInsets()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const organizationId = state.status === 'signedIn' ? (state.activeOrganizationId ?? '') : ''
  const { apiaries, loading } = useApiaries(organizationId)
  const [search, setSearch] = useState('')

  const wanted = fold(search.trim())
  const shown = wanted
    ? apiaries.filter((a) => fold(`${a.name} ${a.farm_name ?? ''}`).includes(wanted))
    : apiaries
  const create = () => router.push('/apiary/new')

  const empty = wanted ? (
    <EmptyState icon={SearchX} title="Ningún apiario coincide" body="Prueba con otro nombre." />
  ) : owner ? (
    <EmptyState
      icon={MapPin}
      title="Crea tu primer apiario"
      body="Un apiario es un sitio de tu finca con sus colmenas."
      action={{ label: 'Crear apiario', onPress: create }}
    />
  ) : (
    <EmptyState icon={MapPin} title="Este apicultor aún no tiene apiarios." />
  )

  return (
    <View className="flex-1 bg-bg-soft" style={{ paddingTop: insets.top }}>
      <FlatList
        data={shown}
        keyExtractor={(apiary) => apiary.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <Text accessibilityRole="header" className="font-display text-title text-text">
              Apiarios
            </Text>
            {apiaries.length > 0 ? (
              <TextField
                label="Buscar"
                value={search}
                onChangeText={setSearch}
                placeholder="Nombre o finca"
                autoCorrect={false}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={loading ? null : empty}
        renderItem={({ item }) => (
          <ApiaryListItem
            apiary={item}
            onPress={() => router.push({ pathname: '/apiary/[id]', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{ padding: 16, paddingBottom: owner ? 112 : 32 }}
        style={{ backgroundColor: color.bgSoft }}
      />
      {owner && apiaries.length > 0 ? (
        <View className="absolute right-4 bottom-4">
          <Button icon={Plus} label="Nuevo apiario" onPress={create} />
        </View>
      ) : null}
    </View>
  )
}
