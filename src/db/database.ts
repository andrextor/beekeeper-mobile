import * as Sharing from 'expo-sharing'
import {
  defaultDatabaseDirectory,
  deleteDatabaseAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
} from 'expo-sqlite'

import { registerWipe } from '@/lib/wipe'
import { type Db, type SqlValue, serialized } from './db'
import { migrate } from './migrate'

const name = 'landak.db'

let opening: Promise<{ native: SQLiteDatabase; db: Db }> | null = null
let wiping: Promise<void> | null = null

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
  try {
    await migrate(db)
  } catch (error) {
    // The failed step rolled back; fold the WAL into the file so "Enviar respaldo" carries everything.
    await native.execAsync('pragma wal_checkpoint(truncate)').catch(() => {})
    await native.closeAsync().catch(() => {})
    throw error
  }
  return { native, db }
}

/** The database file itself, for Iván to recover when an update cannot migrate it. */
export async function shareDatabase(): Promise<void> {
  const dir = String(defaultDatabaseDirectory)
  const uri = `${dir.startsWith('file://') ? dir : `file://${dir}`}/${name}`
  await Sharing.shareAsync(uri, { mimeType: 'application/x-sqlite3', dialogTitle: 'Respaldo' })
}

/** The app's local database, opened and migrated once. */
export async function getDb(): Promise<Db> {
  // A query or sync during sign-out must not reopen the file before it is deleted.
  while (wiping) await wiping
  opening ??= open()
  try {
    return (await opening).db
  } catch (error) {
    opening = null
    throw error
  }
}

async function wipe(): Promise<void> {
  const current = opening
  opening = null
  try {
    if (current) await (await current).native.closeAsync()
  } catch {
    // A database that never opened has nothing to close.
  }
  // Also fails when no file exists yet (nothing to erase).
  await deleteDatabaseAsync(name).catch(() => {})
}

registerWipe(async () => {
  wiping = wipe()
  try {
    await wiping
  } finally {
    wiping = null
  }
})
