import { Directory, File, Paths } from 'expo-file-system'

import { registerWipe } from './wipe'

// Photos live in the document directory (Android may clear the cache one), one folder for all.
const folder = () => new Directory(Paths.document, 'photos')

export function photoFiles(id: string): { main: File; thumb: File } {
  const dir = folder()
  if (!dir.exists) dir.create({ intermediates: true })
  return { main: new File(dir, `${id}.jpg`), thumb: new File(dir, `${id}.thumb.jpg`) }
}

/** Deletes whatever files a photo still has on the phone. */
export function deletePhotoFiles(...uris: (string | null | undefined)[]): void {
  for (const uri of uris) {
    if (!uri) continue
    const file = new File(uri)
    if (file.exists) file.delete()
  }
}

export function fileExists(uri: string | null | undefined): boolean {
  return Boolean(uri) && new File(uri ?? '').exists
}

/** Bytes used by every photo file on the phone. */
export function photosFolderBytes(): number {
  const dir = folder()
  if (!dir.exists) return 0
  return dir.list().reduce((sum, entry) => sum + (entry instanceof File ? entry.size : 0), 0)
}

// Signing out erases the photos with the database (AGENTS.md → Security boundaries).
registerWipe(async () => {
  const dir = folder()
  if (dir.exists) dir.delete()
})
