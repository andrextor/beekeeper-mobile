export type SqlValue = string | number | null

/** The subset of expo-sqlite the app uses; tests back it with node:sqlite (test-db.ts). */
export type Db = {
  execAsync(sql: string): Promise<void>
  runAsync(sql: string, params?: SqlValue[]): Promise<{ changes: number }>
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>
  /** Commits or rolls back `task`; transactions run one at a time. */
  transaction(task: () => Promise<void>): Promise<void>
}

/**
 * One connection is shared by the UI and the sync engine, and expo-sqlite's transactions are not
 * exclusive: queuing them keeps one write from landing inside another's transaction.
 */
export function serialized(
  run: (task: () => Promise<void>) => Promise<void>,
): (task: () => Promise<void>) => Promise<void> {
  let tail: Promise<void> = Promise.resolve()
  return (task) => {
    const result = tail.then(() => run(task))
    tail = result.catch(() => {})
    return result
  }
}
