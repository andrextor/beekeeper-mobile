import { File } from 'expo-file-system'

import { getDb } from '@/db/database'
import { uuid } from '@/lib/ids'
import { processPhoto } from './process'
import { savePhoto } from './save'

type Where = { organizationId: string; hiveId: string; inspectionId: string | null; userId: string }

export type Taken = { id: string; thumbUri: string }

/**
 * One shot or one picked image: resized files on the phone, then the row and its outbox entry.
 * `deleteSource` removes the camera's temporary original (never a gallery photo).
 */
export async function keepPhoto(
  source: { uri: string; width?: number; height?: number },
  where: Where,
  deleteSource: boolean,
): Promise<Taken> {
  const id = uuid()
  const sourceUri = source.uri
  const size =
    source.width && source.height ? { width: source.width, height: source.height } : undefined
  const processed = await processPhoto(sourceUri, id, size)
  if (deleteSource) {
    const original = new File(sourceUri)
    if (original.exists) original.delete()
  }
  await savePhoto(await getDb(), { ...processed, ...where, id, takenAt: new Date().toISOString() })
  return { id, thumbUri: processed.thumbUri }
}

export const noSpace = 'No hay espacio en el teléfono para guardar la foto.'
