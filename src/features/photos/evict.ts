import type { Db } from '@/db/db'
import { onFullSync } from '@/features/sync/triggers'
import { deletePhotoFiles, photosFolderBytes } from '@/lib/photo-files'

export type Candidate = { id: string; main: string; bytes: number; seen: string }

const keepDays = 30
const maxBytes = 500 * 1024 * 1024

/**
 * Main files that may go (thumbnails always stay): synced and unseen for 30 days, then the least
 * recently seen while the folder is over 500 MB. `candidates` are synced photos only.
 */
export function chooseEvictions(
  candidates: readonly Candidate[],
  folderBytes: number,
  now: Date,
): string[] {
  const cutoff = new Date(now.getTime() - keepDays * 86_400_000).toISOString()
  const oldestFirst = [...candidates].sort((a, b) => a.seen.localeCompare(b.seen))
  const chosen = new Set(oldestFirst.filter((c) => c.seen < cutoff).map((c) => c.id))
  let total =
    folderBytes - oldestFirst.filter((c) => chosen.has(c.id)).reduce((s, c) => s + c.bytes, 0)
  for (const c of oldestFirst) {
    if (total <= maxBytes) break
    if (chosen.has(c.id)) continue
    chosen.add(c.id)
    total -= c.bytes
  }
  return [...chosen]
}

/** After a sync and at start. Never a photo that is not on the server or still has an outbox entry. */
export async function evictPhotos(db: Db, now: Date = new Date()): Promise<void> {
  const candidates = await db.getAllAsync<Candidate>(
    `select id, local_main_uri as main, coalesce(bytes, 0) as bytes,
       coalesce(last_viewed_at, taken_at) as seen
     from photos
     where local_main_uri is not null and _on_server = 1 and upload_step = 'row'
       and id not in (select row_id from outbox where table_name = 'photos')`,
  )
  // ponytail: scans the folder each run, fine up to a few thousand files; keep a total in settings if slow.
  const ids = chooseEvictions(candidates, photosFolderBytes(), now)
  for (const id of ids) {
    const c = candidates.find((x) => x.id === id)
    deletePhotoFiles(c?.main)
  }
  if (ids.length === 0) return
  await db.transaction(async () => {
    for (const id of ids)
      await db.runAsync('update photos set local_main_uri = null where id = ?', [id])
  })
}

// Registered when the photos module loads: every full sync (the first one at start) cleans up.
onFullSync((db) => evictPhotos(db))
