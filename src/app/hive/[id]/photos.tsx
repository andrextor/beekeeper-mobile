import { router, useLocalSearchParams } from 'expo-router'
import { Camera, ImageOff } from 'lucide-react-native'
import { useState } from 'react'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { useCanRecord } from '@/features/auth/session'
import { PhotoGrid } from '@/features/photos/PhotoGrid'
import { usePhotos } from '@/features/photos/queries'

// Pages of 60 thumbnails: a hive with years of photos never loads them all at once.
const page = 60

/** Every photo of the hive, thumbnails only, "Cargar más" for older ones. */
export default function HivePhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [limit, setLimit] = useState(page)
  const photos = usePhotos({ hiveId: id }, limit)
  const canRecord = useCanRecord()
  return (
    <Screen hero={{ title: 'Fotos' }}>
      <BackButton />
      {canRecord ? (
        <Button
          variant="accent"
          icon={Camera}
          label="Tomar foto"
          onPress={() => router.push({ pathname: '/hive/[id]/camera', params: { id } })}
        />
      ) : null}
      {photos.length ? (
        <PhotoGrid
          photos={photos}
          onOpen={(photoId) => router.push({ pathname: '/photo/[id]', params: { id: photoId } })}
        />
      ) : (
        <EmptyState icon={ImageOff} title="Esta colmena aún no tiene fotos." />
      )}
      {photos.length === limit ? (
        <Button variant="secondary" label="Cargar más" onPress={() => setLimit((l) => l + page)} />
      ) : null}
    </Screen>
  )
}
