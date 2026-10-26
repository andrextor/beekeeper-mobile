import { useNetworkState } from 'expo-network'
import { useSyncExternalStore } from 'react'

import { useLocalQuery } from '@/db/useLocalQuery'
import { runStatus } from './triggers'

export type SyncStatus = {
  pending: number
  attention: number
  online: boolean
  running: boolean
  error: string | null
  /** The last time every table finished a pull. */
  lastSyncAt: string | null
}

const countsSql = `select
  (select count(*) from outbox where state = 'pending') as pending,
  (select count(*) from outbox where state = 'failed_permanent') as attention,
  (select max(last_pull_at) from sync_state) as last_sync_at`

export function useSyncStatus(): SyncStatus {
  const { rows } = useLocalQuery<{
    pending: number
    attention: number
    last_sync_at: string | null
  }>(countsSql, [], ['outbox', 'sync_state'])
  const network = useNetworkState()
  const { running, error } = useSyncExternalStore(runStatus.subscribe, runStatus.get)
  const counts = rows[0]
  return {
    pending: counts?.pending ?? 0,
    attention: counts?.attention ?? 0,
    online: network.isConnected !== false && network.isInternetReachable !== false,
    running,
    error,
    lastSyncAt: counts?.last_sync_at ?? null,
  }
}
