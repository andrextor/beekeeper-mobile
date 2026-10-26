import { addDatabaseChangeListener } from 'expo-sqlite'
import { useEffect, useRef, useState } from 'react'

import { getDb } from './database'
import type { Db, SqlValue } from './db'

/**
 * Runs `read` on the local database, again when `key` changes and whenever one of `tables` changes.
 * The result is tagged with the key that produced it: a new key never shows the old answer.
 */
export function useLocalRead<T>(
  read: (db: Db) => Promise<T>,
  key: string,
  tables: readonly string[],
): { data: T | null; loading: boolean } {
  const [result, setResult] = useState<{ key: string; data: T } | null>(null)
  const latestRead = useRef(read)
  latestRead.current = read
  const tablesKey = tables.join(',')

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const run = async () => {
      timer = null
      try {
        const data = await latestRead.current(await getDb())
        if (alive) setResult({ key, data })
      } catch {
        // A database being wiped keeps the last answer until it reopens.
      }
    }
    void run()
    const watched = tablesKey.split(',')
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      // A pulled page changes hundreds of rows: one read per burst.
      if (watched.includes(tableName) && !timer) timer = setTimeout(run, 50)
    })
    return () => {
      alive = false
      subscription.remove()
      if (timer) clearTimeout(timer)
    }
  }, [key, tablesKey])

  const current = result?.key === key ? result : null
  return { data: current?.data ?? null, loading: current === null }
}

/** `sql` on the local database, again whenever one of `tables` changes. */
export function useLocalQuery<T>(
  sql: string,
  params: SqlValue[],
  tables: readonly string[],
): { rows: T[]; loading: boolean } {
  const { data, loading } = useLocalRead(
    (db) => db.getAllAsync<T>(sql, params),
    `${sql}\n${JSON.stringify(params)}`,
    tables,
  )
  return { rows: data ?? [], loading }
}
