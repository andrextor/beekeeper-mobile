import initial from './0001_initial'

/** Ordered local schema steps; `PRAGMA user_version` counts the ones applied. Append only. */
export const migrations: readonly string[] = [initial]
