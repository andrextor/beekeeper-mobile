import { deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite'

import { registerWipe } from '@/lib/wipe'
import { type Db, type SqlValue, serialized } from './db'
import { migrate } from './migrate'

const name = 'landak.db'

let opening: Promise<{ native: SQLiteDatabase; db: Db }> | null = null

async function open() {
  // The change listener feeds useLocalQuery.
  const native = await openDatabaseAsync(name, { enableChangeListener: true })
  await native.execAsync('pragma journal_mode = WAL; pragma foreign_keys = ON;')
  const db: Db = {
    execAsync: (sql) => native.execAsync(sql),
    runAsync: async (sql, params: SqlValue[] = []) => ({
      changes: (await native.runAsync(sql, params)).changes,
    }),
    getAllAsync: <T>(sql: string, params: SqlValue[] = []) => native.getAllAsync<T>(sql, params),
    getFirstAsync: <T>(sql: string, params: SqlValue[] = []) =>
      native.getFirstAsync<T>(sql, params),
    transaction: serialized((task) => native.withTransactionAsync(task)),
  }
  await migrate(db)
  return { native, db }
}

/** The app's local database, opened and migrated once. */
export async function getDb(): Promise<Db> {
  opening ??= open()
  try {
    return (await opening).db
  } catch (error) {
    opening = null
    throw error
  }
}

registerWipe(async () => {
  const current = opening
  opening = null
  try {
    if (current) await (await current).native.closeAsync()
  } catch {
    // A database that never opened has nothing to close.
  }
  await deleteDatabaseAsync(name).catch(() => {})
})
