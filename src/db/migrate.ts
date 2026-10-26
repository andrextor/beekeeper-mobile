import type { Db } from './db'
import { migrations } from './migrations'

/** Runs the steps this database has not seen, all in one transaction (APK updates keep local data). */
export async function migrate(db: Db, steps: readonly string[] = migrations): Promise<void> {
  const current = (await db.getFirstAsync<{ user_version: number }>('pragma user_version'))
    ?.user_version
  const from = current ?? 0
  if (from >= steps.length) return
  await db.transaction(async () => {
    for (const step of steps.slice(from)) await db.execAsync(step)
    await db.execAsync(`pragma user_version = ${steps.length}`)
  })
}
