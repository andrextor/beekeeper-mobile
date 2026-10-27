import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Check, Images, Zap, ZapOff } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ShutterButton } from '@/components/field/ShutterButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toast } from '@/components/ui/Toast'
import { getDb } from '@/db/database'
import { fromLocal, type LocalRow } from '@/db/mapping'
import { saveRow } from '@/db/write'
import { plural } from '@/lib/format'
import { successHaptic, withTap } from '@/lib/haptics'
import { color, iconSize } from '@/lib/theme'
import { keepPhoto, noSpace, type Taken } from './capture'

type Props = {
  organizationId: string
  hiveId: string
  inspectionId: string | null
  userId: string
  onDone: () => void
}

/** Burst camera for gloves (spec M9 → Capture): 96-dp shutter, no confirmation, undo in the strip. */
export function CameraScreen({ organizationId, hiveId, inspectionId, userId, onDone }: Props) {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const camera = useRef<CameraView>(null)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [taken, setTaken] = useState<Taken[]>([])
  const [removing, setRemoving] = useState<Taken[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const undone = useRef(false)
  const where = { organizationId, hiveId, inspectionId, userId }

  if (!permission) return null
  if (!permission.granted) {
    return (
      <View
        className="flex-1 justify-center gap-3 bg-bg-soft p-4"
        style={{ paddingTop: insets.top }}
      >
        <EmptyState
          icon={Camera}
          title="Para tomar fotos de tus colmenas necesitamos usar la cámara."
          action={
            permission.canAskAgain
              ? { label: 'Permitir cámara', onPress: () => void requestPermission() }
              : { label: 'Abrir ajustes', onPress: () => void Linking.openSettings() }
          }
        />
        <Button variant="secondary" label="Volver" onPress={onDone} />
      </View>
    )
  }

  const keep = async (
    sources: { uri: string; width?: number; height?: number }[],
    fromCamera: boolean,
  ) => {
    setBusy(true)
    try {
      for (const source of sources) {
        const photo = await keepPhoto(source, where, fromCamera)
        successHaptic()
        setTaken((list) => [photo, ...list])
      }
    } catch {
      setMessage(noSpace)
    } finally {
      setBusy(false)
    }
  }

  const shoot = async () => {
    if (busy) return
    const picture = await camera.current?.takePictureAsync({ quality: 0.9 }).catch(() => null)
    if (picture?.uri) await keep([picture], true)
  }

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    })
    if (!result.canceled) await keep(result.assets, false)
  }

  // Removals become final when the undo window closes or on Listo; a photo never uploaded leaves
  // no trace (M9). Several taps in a row add to the same window.
  const commitRemovals = async (photos: Taken[]) => {
    const db = await getDb()
    for (const photo of photos) {
      const row = await db.getFirstAsync<LocalRow>('select * from photos where id = ?', [photo.id])
      if (row) {
        await saveRow(db, 'photos', {
          ...fromLocal('photos', row),
          deleted_at: new Date().toISOString(),
        })
      }
    }
  }
  const closeUndo = async () => {
    const photos = removing
    setRemoving([])
    if (undone.current) return
    await commitRemovals(photos)
  }
  const done = async () => {
    if (removing.length) await commitRemovals(removing)
    onDone()
  }

  const shown = taken.filter((t) => !removing.some((r) => r.id === t.id))

  return (
    <View className="flex-1 bg-deep">
      <CameraView ref={camera} style={{ flex: 1 }} facing="back" flash={flash ? 'on' : 'off'} />
      <View className="absolute right-4 left-4 gap-3" style={{ bottom: insets.bottom + 16 }}>
        {shown.length ? (
          <View className="gap-2">
            <Text className="font-sans-semibold text-body text-white">
              {plural(shown.length, 'foto', 'fotos')}
            </Text>
            <ScrollView horizontal contentContainerClassName="gap-2">
              {shown.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar esta foto"
                  onPress={withTap(() => {
                    undone.current = false
                    setRemoving((list) => [...list, t])
                  })}
                >
                  <Image source={{ uri: t.thumbUri }} className="size-16 rounded-field" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={flash ? 'Apagar flash' : 'Encender flash'}
            onPress={withTap(() => setFlash((on) => !on))}
            className="size-target items-center justify-center rounded-full bg-deep/80"
          >
            {flash ? (
              <Zap color={color.bg} size={iconSize.standard} />
            ) : (
              <ZapOff color={color.bg} size={iconSize.standard} />
            )}
          </Pressable>
          <ShutterButton onPress={() => void shoot()} disabled={busy} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Listo"
            onPress={withTap(() => void done())}
            className="size-field items-center justify-center rounded-full bg-primary"
          >
            <Check color={color.onPrimary} size={iconSize.field} />
          </Pressable>
        </View>
        <Button
          variant="secondary"
          icon={Images}
          label="Desde la galería"
          disabled={busy}
          onPress={() => void pick()}
        />
      </View>
      <Toast
        message={removing.length ? plural(removing.length, 'foto quitada', 'fotos quitadas') : null}
        onUndo={() => {
          undone.current = true
        }}
        onHide={() => void closeUndo()}
        durationMs={4000}
      />
      <Toast tone="danger" message={message} onHide={() => setMessage(null)} />
    </View>
  )
}
