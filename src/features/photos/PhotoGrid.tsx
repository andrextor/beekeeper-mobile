import { ImageOff } from 'lucide-react-native'
import { Image, Pressable, View } from 'react-native'

import { color, iconSize } from '@/lib/theme'
import type { PhotoItem } from './queries'
import { thumbSource } from './sources'
import { useSignedUrls } from './useSignedUrls'

/** Thumbnails only (B5 budget: grids never load main files), three per row, 96 dp. */
export function PhotoGrid({
  photos,
  onOpen,
}: {
  photos: PhotoItem[]
  onOpen: (id: string) => void
}) {
  const sources = photos.map(thumbSource)
  const signed = useSignedUrls(sources.flatMap((s) => ('path' in s ? [s.path] : [])))
  return (
    <View className="flex-row flex-wrap gap-2">
      {photos.map((photo, i) => {
        const source = sources[i]
        const uri = source && ('uri' in source ? source.uri : signed(source.path))
        return (
          <Pressable
            key={photo.id}
            accessibilityRole="button"
            accessibilityLabel={photo.caption ?? 'Foto'}
            onPress={() => onOpen(photo.id)}
            className="size-tile items-center justify-center overflow-hidden rounded-button bg-stone-100 active:opacity-80"
          >
            {uri ? (
              <Image source={{ uri }} className="size-tile" />
            ) : (
              <ImageOff color={color.muted} size={iconSize.standard} />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}
