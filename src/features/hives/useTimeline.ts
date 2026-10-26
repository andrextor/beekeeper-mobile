import { useNetworkState } from 'expo-network'
import { useEffect, useState } from 'react'

import { useLocalQuery, useLocalRead } from '@/db/useLocalQuery'
import { localTimeline, type TimelineItem } from './timeline'
import { type RemoteCursor, remoteTimelinePage } from './timeline-remote'

const pageSize = 30
const syncedTables = 5

export type Timeline = {
  items: TimelineItem[]
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  /** Why part of the history may be missing, or `null`. */
  notice: string | null
}

/**
 * The phone's history once the finca's first download is done (works offline); until then, online,
 * the server's (`hive_timeline`), so a hive scanned right after signing in already shows its past.
 */
export function useTimeline(hiveId: string, organizationId: string): Timeline {
  const network = useNetworkState()
  const online = network.isConnected !== false && network.isInternetReachable !== false
  const done = useLocalQuery<{ n: number }>(
    'select count(*) as n from sync_state where organization_id = ? and initial_pull_done = 1',
    [organizationId],
    ['sync_state'],
  )
  const downloaded = (done.rows[0]?.n ?? 0) >= syncedTables
  const remote = !done.loading && !downloaded && online

  const [limit, setLimit] = useState(pageSize)
  const local = useLocalRead((db) => localTimeline(db, hiveId, limit), `${hiveId}:${limit}`, [
    'inspections',
    'hive_events',
    'outbox',
    'profiles_cache',
  ])

  const [pages, setPages] = useState<{ items: TimelineItem[]; next: RemoteCursor } | null>(null)
  const [remoteFailed, setRemoteFailed] = useState(false)
  useEffect(() => {
    if (!remote) return
    let alive = true
    setPages(null)
    setRemoteFailed(false)
    remoteTimelinePage(hiveId, null)
      .then((page) => alive && setPages(page))
      .catch(() => alive && setRemoteFailed(true))
    return () => {
      alive = false
    }
  }, [remote, hiveId])

  if (remote && !remoteFailed) {
    return {
      items: pages?.items ?? [],
      loading: pages === null,
      hasMore: pages?.next != null,
      loadMore: () => {
        if (!pages?.next) return
        remoteTimelinePage(hiveId, pages.next)
          .then((page) => setPages({ items: [...pages.items, ...page.items], next: page.next }))
          .catch(() => setRemoteFailed(true))
      },
      notice: 'Mostrando historial del servidor mientras se descarga.',
    }
  }

  const items = local.data ?? []
  return {
    items,
    loading: local.loading,
    hasMore: items.length >= limit,
    loadMore: () => setLimit((l) => l + pageSize),
    notice: done.loading || downloaded ? null : 'Parte del historial aún no está en este teléfono.',
  }
}
