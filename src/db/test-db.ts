/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite'

import { type Db, serialized, type SqlValue } from './db'

/** In-memory database for Jest: same SQL engine as the phone, behind the app's `Db` subset. */
export function openTestDb(): Db {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  return {
    execAsync: async (sql) => {
      db.exec(sql)
    },
    runAsync: async (sql, params: SqlValue[] = []) => ({
      changes: Number(db.prepare(sql).run(...params).changes),
    }),
    getAllAsync: async <T>(sql: string, params: SqlValue[] = []) =>
      db.prepare(sql).all(...params) as T[],
    getFirstAsync: async <T>(sql: string, params: SqlValue[] = []) =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
    transaction: serialized(async (task) => {
      db.exec('BEGIN')
      try {
        await task()
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    }),
  }
}
