import { errorCode, isNetworkError } from '@/lib/errors'

/** retry: back off and try again · drop: the change is moot · attention: a person must decide. */
export type Verdict = 'retry' | 'drop' | 'attention'

/**
 * api.md → Sync push. `onServer`: the server already has this row, so a `parent_deleted` edit is
 * dropped; a row created offline is never dropped silently.
 */
export function classify(error: unknown, status: number | undefined, onServer: boolean): Verdict {
  if (status === undefined || status === 0 || status === 401 || status === 408) return 'retry'
  if (status === 429 || status >= 500 || isNetworkError(error)) return 'retry'
  if (errorCode(error) === 'parent_deleted') return onServer ? 'drop' : 'attention'
  return 'attention'
}

const delaysMs = [5_000, 30_000, 120_000, 600_000]

/** The foreground sync tick: a due retry waits for it (or for a manual sync, a save, a reconnect). */
export const foregroundSyncEveryMs = 2 * 60_000

/** 5 s → 30 s → 2 min → 10 min, then every 10 min: the data is never dropped. */
export function retryDelayMs(attempts: number): number {
  return delaysMs[Math.min(Math.max(attempts, 1), delaysMs.length) - 1] ?? 600_000
}
