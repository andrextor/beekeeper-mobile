import { File } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

import { photoFiles } from '@/lib/photo-files'
import { fitLongSide, jpegQuality, mainLongSide, thumbLongSide } from './sizes'

export type Processed = {
  mainUri: string
  thumbUri: string
  width: number
  height: number
  bytes: number
}

async function resized(sourceUri: string, max: number) {
  const original = await ImageManipulator.manipulate(sourceUri).renderAsync()
  const image = await ImageManipulator.manipulate(sourceUri)
    .resize(fitLongSide(original.width, original.height, max))
    .renderAsync()
  return image.saveAsync({ compress: jpegQuality, format: SaveFormat.JPEG })
}

/**
 * The phone keeps a 1600-px main file and a 320-px thumbnail in its document folder; the original
 * is never uploaded (3–6 MB each would burn the free storage and the data plan).
 */
export async function processPhoto(sourceUri: string, id: string): Promise<Processed> {
  const files = photoFiles(id)
  const main = await resized(sourceUri, mainLongSide)
  const thumb = await resized(sourceUri, thumbLongSide)
  await new File(main.uri).move(files.main)
  await new File(thumb.uri).move(files.thumb)
  return {
    mainUri: files.main.uri,
    thumbUri: files.thumb.uri,
    width: main.width,
    height: main.height,
    bytes: files.main.size,
  }
}
