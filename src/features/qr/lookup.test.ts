import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { type LookupDeps, lookupHive } from './lookup'

const code = 'V1C01A7K2M'

async function database(): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  return db
}

const insertHive = (db: Db, organizationId = 'org-1') =>
  db.runAsync(
    "insert into hives (id, organization_id, apiary_id, name, qr_code) values ('h-1', ?, 'a-1', 'C-01', ?)",
    [organizationId, code],
  )

function deps(db: Db, overrides: Partial<LookupDeps> = {}): LookupDeps {
  return {
    db,
    findOnServer: async () => null,
    syncAll: async () => {},
    isOwner: true,
    ...overrides,
  }
}

describe('lookupHive', () => {
  it('finds a hive on the phone without asking the server', async () => {
    const db = await database()
    await insertHive(db, 'org-2')
    const findOnServer = jest.fn()
    expect(await lookupHive(code, deps(db, { findOnServer }))).toEqual({
      kind: 'found',
      hiveId: 'h-1',
      organizationId: 'org-2',
    })
    expect(findOnServer).not.toHaveBeenCalled()
  })

  it('never says "not ours" without signal', async () => {
    const db = await database()
    const offline = async () => {
      throw new Error('Network request failed')
    }
    expect(await lookupHive(code, deps(db, { findOnServer: offline, isOwner: false }))).toEqual({
      kind: 'offline_unknown',
    })
  })

  it('offers the owner to assign an unknown code; a reviewer just hears it is not theirs', async () => {
    const db = await database()
    expect(await lookupHive(code, deps(db))).toEqual({ kind: 'unassigned' })
    expect(await lookupHive(code, deps(db, { isOwner: false }))).toEqual({ kind: 'not_ours' })
  })

  it('syncs a hive that is ours but not on the phone yet', async () => {
    const db = await database()
    const remote = async () => ({ id: 'h-1', organization_id: 'org-1' })
    expect(
      await lookupHive(
        code,
        deps(db, { findOnServer: remote, syncAll: () => insertHive(db).then(() => {}) }),
      ),
    ).toMatchObject({ kind: 'found', hiveId: 'h-1' })
    const empty = await database()
    expect(await lookupHive(code, deps(empty, { findOnServer: remote }))).toEqual({
      kind: 'not_synced',
    })
  })
})
