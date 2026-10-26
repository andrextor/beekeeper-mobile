import type { Db } from '@/db/db'
import { deletePhotoFiles, fileExists } from '@/lib/photo-files'
import type { Step } from './order'

type PhotoRow = {
  _on_server: number
  upload_step: string
  local_main_uri: string | null
  local_thumb_uri: string | null
  storage_path: string
}

export type Upload = (
  path: string,
  localUri: string,
) => Promise<{ error: unknown; status?: number }>

/** What the pusher does next with a photo entry. */
export type PhotoStep =
  | { kind: 'row' }
  | { kind: 'wait' }
  | { kind: 'done' }
  | { kind: 'failed'; error: unknown; status: number | undefined; message: string }

const undoWindowMs = 10_000

const storageMessages: Readonly<Record<number, string>> = {
  403: 'No se pudo subir la foto: la colmena ya no existe o ya no tienes acceso a la finca.',
  413: 'La foto es demasiado grande para subirla.',
}

/**
 * B5 → Upload order, resumable: main file → thumbnail → (the caller) the row. A photo that never
 * reached the server and was deleted meanwhile is dropped with its files instead of uploaded.
 */
export async function preparePhoto(
  db: Db,
  step: Step,
  deps: { upload: Upload; allowed: boolean },
): Promise<PhotoStep> {
  const id = step.entry.row_id
  const row = await db.getFirstAsync<PhotoRow>(
    'select _on_server, upload_step, local_main_uri, local_thumb_uri, storage_path from photos where id = ?',
    [id],
  )
  if (!row) return { kind: 'row' }
  const { deleted_at: deletedAt } = JSON.parse(step.entry.payload) as { deleted_at?: unknown }
  const deleted = typeof deletedAt === 'string'
  // Deshacer stays possible for a moment (5-s toasts): the drop waits until it has passed.
  if (
    row._on_server === 0 &&
    deleted &&
    Date.now() - new Date(deletedAt).getTime() < undoWindowMs
  ) {
    return { kind: 'wait' }
  }
  if (row._on_server === 0 && deleted) {
    // ponytail: files already uploaded (upload_step main/thumb) stay in Storage; the app has no
    // delete policy (B5) and orphan cleanup is a later server job (api.md → Upload order).
    await db.transaction(async () => {
      await db.runAsync('delete from outbox where id = ?', [step.entry.id])
      await db.runAsync('delete from photos where id = ?', [id])
    })
    deletePhotoFiles(row.local_main_uri, row.local_thumb_uri)
    return { kind: 'done' }
  }
  // Once the row exists the files cannot be replaced (B5): an edit pushes the row only.
  if (row._on_server === 1 || row.upload_step === 'row') return { kind: 'row' }
  if (!deps.allowed) return { kind: 'wait' }

  const files: [from: string, local: string | null, path: string][] = [
    ['none', row.local_main_uri, row.storage_path],
    ['main', row.local_thumb_uri, row.storage_path.replace(/\.jpg$/, '.thumb.jpg')],
  ]
  let at = row.upload_step
  for (const [from, local, path] of files) {
    if (at !== from) continue
    if (!local || !fileExists(local)) {
      return {
        kind: 'failed',
        error: { message: 'missing file' },
        status: 400,
        message: 'La foto ya no está en este teléfono. Descártala.',
      }
    }
    const { error, status } = await deps.upload(path, local)
    if (error) {
      return {
        kind: 'failed',
        error,
        status,
        message: (status && storageMessages[status]) || 'No se pudo subir la foto.',
      }
    }
    at = from === 'none' ? 'main' : 'thumb'
    await db.transaction(async () => {
      await db.runAsync('update photos set upload_step = ? where id = ?', [at, id])
    })
  }
  return { kind: 'row' }
}
