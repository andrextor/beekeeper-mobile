import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, ChevronRight, ImageOff, Trash2, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Image, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { TextField } from '@/components/ui/TextField'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { fromLocal, type LocalRow } from '@/db/mapping'
import { saveRow } from '@/db/write'
import { useRole, useSession } from '@/features/auth/session'
import { usePhoto, usePhotos } from '@/features/photos/queries'
import { mainSource } from '@/features/photos/sources'
import { useSignedUrls } from '@/features/photos/useSignedUrls'
import { formatDateTime } from '@/lib/format'

async function update(id: string, patch: { caption?: string | null; deleted_at?: string | null }) {
  const db = await getDb()
  const row = await db.getFirstAsync<LocalRow>('select * from photos where id = ?', [id])
  if (row) await saveRow(db, 'photos', { ...fromLocal('photos', row), ...patch })
}

/** Full photo with 56-dp close and previous / next (no swipe needed), caption, delete with undo. */
export default function PhotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const photo = usePhoto(id)
  const siblings = usePhotos({ hiveId: photo?.hive_id ?? '' })
  const source = photo ? mainSource(photo) : null
  const signed = useSignedUrls(source && 'path' in source ? [source.path] : [])
  const [caption, setCaption] = useState<string | null>(null)

  useEffect(() => {
    // Eviction (spec M9) keeps the main files people look at.
    void getDb().then((db) =>
      db.transaction(async () => {
        await db.runAsync('update photos set last_viewed_at = ? where id = ?', [
          new Date().toISOString(),
          id,
        ])
      }),
    )
  }, [id])

  if (!photo) return <NotAvailable icon={ImageOff} title="Esta foto ya no está." />
  const uri = source && ('uri' in source ? source.uri : signed(source.path))
  const index = siblings.findIndex((p) => p.id === id)
  const go = (to: number) => {
    const next = siblings[to]
    if (next) router.replace({ pathname: '/photo/[id]', params: { id: next.id } })
  }
  const userId = state.status === 'signedIn' ? state.session.user.id : null
  const canDelete = owner || photo.created_by === userId

  return (
    <View
      className="flex-1 bg-deep"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center justify-between px-4 py-2">
        <IconButton icon={X} label="Cerrar" onPress={() => router.back()} />
        <Text className="font-sans text-body text-white">{formatDateTime(photo.taken_at)}</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        {uri ? (
          <Image source={{ uri }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text className="font-sans text-body text-white">Cargando la foto…</Text>
        )}
      </View>
      <View className="gap-3 px-4 pt-3">
        <View className="flex-row justify-between">
          <IconButton
            icon={ChevronLeft}
            label="Foto anterior"
            onPress={() => go(index - 1)}
            disabled={index <= 0}
          />
          <IconButton
            icon={ChevronRight}
            label="Foto siguiente"
            onPress={() => go(index + 1)}
            disabled={index < 0 || index >= siblings.length - 1}
          />
        </View>
        {caption === null ? (
          <Button
            variant="secondary"
            label={photo.caption ? photo.caption : 'Agregar descripción'}
            onPress={() => setCaption(photo.caption ?? '')}
          />
        ) : (
          <>
            <TextField
              label="Descripción"
              value={caption}
              onChangeText={setCaption}
              maxLength={300}
            />
            <Button
              label="Guardar descripción"
              onPress={() => {
                void update(id, { caption: caption.trim() || null })
                setCaption(null)
                showToast('Guardado en este dispositivo')
              }}
            />
          </>
        )}
        {canDelete ? (
          <Button
            variant="danger"
            icon={Trash2}
            label="Eliminar foto"
            onPress={() => {
              void update(id, { deleted_at: new Date().toISOString() })
              router.back()
              showToast('Foto eliminada', {
                durationMs: 5000,
                onUndo: () => void update(id, { deleted_at: null }),
              })
            }}
          />
        ) : null}
      </View>
    </View>
  )
}
