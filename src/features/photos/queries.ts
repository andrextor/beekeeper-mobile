import { useLocalQuery } from '@/db/useLocalQuery'

export type PhotoItem = {
  id: string
  hive_id: string
  inspection_id: string | null
  storage_path: string
  local_main_uri: string | null
  local_thumb_uri: string | null
  caption: string | null
  taken_at: string
  created_by: string | null
}

const columns =
  'id, hive_id, inspection_id, storage_path, local_main_uri, local_thumb_uri, caption, taken_at, created_by'

/** A hive's or an inspection's live photos, newest first. */
export function usePhotos(
  scope: { hiveId: string } | { inspectionId: string },
  limit = 100,
): PhotoItem[] {
  const byHive = 'hiveId' in scope
  return useLocalQuery<PhotoItem>(
    `select ${columns} from photos where ${byHive ? 'hive_id' : 'inspection_id'} = ? and deleted_at is null
     order by taken_at desc, id desc limit ?`,
    [byHive ? scope.hiveId : scope.inspectionId, limit],
    ['photos'],
  ).rows
}

export function usePhoto(id: string): PhotoItem | null {
  return (
    useLocalQuery<PhotoItem>(
      `select ${columns} from photos where id = ? and deleted_at is null`,
      [id],
      ['photos'],
    ).rows[0] ?? null
  )
}
