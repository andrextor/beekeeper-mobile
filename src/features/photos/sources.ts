import { fileExists } from '@/lib/photo-files'
import type { PhotoItem } from './queries'
import { thumbPath } from './sizes'

/** The phone's file when it has it, else the path to sign (spec M9 → Viewing: local first). */
export function thumbSource(photo: PhotoItem): { uri: string } | { path: string } {
  if (fileExists(photo.local_thumb_uri) && photo.local_thumb_uri)
    return { uri: photo.local_thumb_uri }
  return { path: thumbPath(photo.storage_path) }
}

export function mainSource(photo: PhotoItem): { uri: string } | { path: string } {
  if (fileExists(photo.local_main_uri) && photo.local_main_uri) return { uri: photo.local_main_uri }
  return { path: photo.storage_path }
}
