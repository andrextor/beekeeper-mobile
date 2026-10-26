import { router, useLocalSearchParams } from 'expo-router'
import { Camera, ImageOff } from 'lucide-react-native'
import { Text } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { PhotoGrid } from '@/features/photos/PhotoGrid'
import { usePhotos } from '@/features/photos/queries'

/** Every photo of the hive, thumbnails only. */
export default function HivePhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const photos = usePhotos({ hiveId: id }, 300)
  return (
    <Screen>
      <BackButton />
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Fotos
      </Text>
      <Button
        variant="accent"
        icon={Camera}
        label="Tomar foto"
        onPress={() => router.push({ pathname: '/hive/[id]/camera', params: { id } })}
      />
      {photos.length ? (
        <PhotoGrid
          photos={photos}
          onOpen={(photoId) => router.push({ pathname: '/photo/[id]', params: { id: photoId } })}
        />
      ) : (
        <EmptyState icon={ImageOff} title="Esta colmena aún no tiene fotos." />
      )}
    </Screen>
  )
}
