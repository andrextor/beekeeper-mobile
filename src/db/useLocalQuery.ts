import { addDatabaseChangeListener } from 'expo-sqlite'
import { useEffect, useState } from 'react'

import { getDb } from './database'
import type { SqlValue } from './db'

/** Runs `sql` on the local database and again whenever one of `tables` changes. */
export function useLocalQuery<T>(
  sql: string,
  params: SqlValue[],
  tables: readonly string[],
): { rows: T[]; loading: boolean } {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const paramsKey = JSON.stringify(params)
  const tablesKey = tables.join(',')

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const run = async () => {
      timer = null
      try {
        const db = await getDb()
        const result = await db.getAllAsync<T>(sql, JSON.parse(paramsKey) as SqlValue[])
        if (alive) setRows(result)
      } catch {
        // A database being wiped keeps the last rows until it reopens.
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    const watched = tablesKey.split(',')
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      // A pulled page changes hundreds of rows: one query per burst.
      if (watched.includes(tableName) && !timer) timer = setTimeout(run, 50)
    })
    return () => {
      alive = false
      subscription.remove()
      if (timer) clearTimeout(timer)
    }
  }, [sql, paramsKey, tablesKey])

  return { rows, loading }
}
