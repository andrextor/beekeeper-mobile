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
  const paramsKey = JSON.stringify(params)
  const tablesKey = tables.join(',')
  const key = `${sql}\n${paramsKey}`
  // Rows are tagged with the query that produced them: new params never show the old answer.
  const [result, setResult] = useState<{ key: string; rows: T[] } | null>(null)

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const run = async () => {
      timer = null
      try {
        const db = await getDb()
        const rows = await db.getAllAsync<T>(sql, JSON.parse(paramsKey) as SqlValue[])
        if (alive) setResult({ key: `${sql}\n${paramsKey}`, rows })
      } catch {
        // A database being wiped keeps the last rows until it reopens.
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

  const current = result?.key === key ? result : null
  return { rows: current?.rows ?? [], loading: current === null }
}
