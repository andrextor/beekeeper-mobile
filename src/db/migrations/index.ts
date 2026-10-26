import initial from './0001_initial'
import inspectionDrafts from './0002_inspection_drafts'
import timestampsUtcMs from './0003_timestamps_utc_ms'

/** Ordered local schema steps; `PRAGMA user_version` counts the ones applied. Append only. */
export const migrations: readonly string[] = [initial, inspectionDrafts, timestampsUtcMs]
