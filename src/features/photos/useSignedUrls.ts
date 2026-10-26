import { useEffect, useState } from 'react'

import { client } from '@/features/sync/server'

// Signed URLs live in memory only (never in SQLite): 1 h from Storage, renewed after 50 min.
const cache = new Map<string, { url: string; until: number }>()
const lifeSeconds = 3600
const renewAfterMs = 50 * 60_000
const batch = 100

const fresh = (path: string) => {
  const hit = cache.get(path)
  return hit && hit.until > Date.now() ? hit.url : null
}

/** One `createSignedUrls` call per 100 paths; returns the URL for each path once signed. */
export function useSignedUrls(paths: readonly string[]): (path: string) => string | null {
  const [, setVersion] = useState(0)
  const key = paths.join('|')

  useEffect(() => {
    const missing = key.split('|').filter((p) => p && !fresh(p))
    if (missing.length === 0) return
    let alive = true
    void (async () => {
      for (let i = 0; i < missing.length; i += batch) {
        const { data } = await client.storage
          .from('hive-photos')
          .createSignedUrls(missing.slice(i, i + batch), lifeSeconds)
        for (const item of data ?? []) {
          if (item.path && item.signedUrl) {
            cache.set(item.path, { url: item.signedUrl, until: Date.now() + renewAfterMs })
          }
        }
      }
      if (alive) setVersion((v) => v + 1)
    })().catch(() => {
      // Offline: grids show the photos this phone has; the rest load with signal.
    })
    return () => {
      alive = false
    }
  }, [key])

  return fresh
}
