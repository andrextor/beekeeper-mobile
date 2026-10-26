import type { Db } from '@/db/db'
import { saveRows } from '@/db/write'
import type { Processed } from './process'
import { storagePath } from './sizes'

export type NewPhoto = Processed & {
  id: string
  organizationId: string
  hiveId: string
  /** The inspection (or field-mode draft) it was taken in; `null` from the hive screen. */
  inspectionId: string | null
  userId: string
  takenAt: string
}

/** The row, its outbox entry and where its files are on the phone, in one transaction. */
export async function savePhoto(db: Db, photo: NewPhoto): Promise<void> {
  await saveRows(
    db,
    [
      {
        table: 'photos',
        row: {
          id: photo.id,
          organization_id: photo.organizationId,
          hive_id: photo.hiveId,
          inspection_id: photo.inspectionId,
          storage_path: storagePath(photo.organizationId, photo.hiveId, photo.id),
          taken_at: photo.takenAt,
          width: photo.width,
          height: photo.height,
          bytes: photo.bytes,
          caption: null,
          created_by: photo.userId,
          created_at: photo.takenAt,
          updated_at: photo.takenAt,
          deleted_at: null,
        },
      },
    ],
    (tx) =>
      tx
        .runAsync(
          `update photos set local_main_uri = ?, local_thumb_uri = ?, upload_step = 'none'
           where id = ?`,
          [photo.mainUri, photo.thumbUri, photo.id],
        )
        .then(() => {}),
  )
}
