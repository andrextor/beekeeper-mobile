import type { Db } from '@/db/db'

export type LookupOutcome =
  | { kind: 'found'; hiveId: string; organizationId: string }
  /** Ours on the server, yet a sync did not bring it: try again later. */
  | { kind: 'not_synced' }
  /** Nobody has this code (or another finca has it): an owner may assign it. */
  | { kind: 'unassigned' }
  | { kind: 'not_ours' }
  /** Not on the phone and no signal: never claim it is not ours. */
  | { kind: 'offline_unknown' }

type Found = { id: string; organization_id: string }

export type LookupDeps = {
  db: Db
  /** RLS-filtered; throws when the server cannot be reached. */
  findOnServer: (code: string) => Promise<Found | null>
  syncAll: () => Promise<void>
  /** Owner of the active finca: an unknown code can be assigned. */
  isOwner: boolean
}

/** The live hive with this code on the phone, any finca. */
export const findLocal = (db: Db, code: string) =>
  db.getFirstAsync<Found>(
    'select id, organization_id from hives where qr_code = ? and deleted_at is null',
    [code],
  )

/** Spec M5 → Lookup sequence: phone first (works offline), then the server, then the verdict. */
export async function lookupHive(code: string, deps: LookupDeps): Promise<LookupOutcome> {
  const found = (hive: Found): LookupOutcome => ({
    kind: 'found',
    hiveId: hive.id,
    organizationId: hive.organization_id,
  })
  const local = await findLocal(deps.db, code)
  if (local) return found(local)

  let remote: Found | null
  try {
    remote = await deps.findOnServer(code)
  } catch {
    return { kind: 'offline_unknown' }
  }
  if (!remote) return { kind: deps.isOwner ? 'unassigned' : 'not_ours' }

  await deps.syncAll()
  const synced = await findLocal(deps.db, code)
  return synced ? found(synced) : { kind: 'not_synced' }
}
