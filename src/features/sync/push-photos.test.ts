import type { Db } from '@/db/db'
import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import type { Step } from './order'
import { preparePhoto, type Upload } from './push-photos'

const mockExisting = new Set<string>()
jest.mock('@/lib/photo-files', () => ({
  fileExists: (uri: string) => mockExisting.has(uri),
  deletePhotoFiles: (...uris: string[]) => {
    for (const u of uris) mockExisting.delete(u)
  },
}))

async function database(step = 'none', onServer = 0): Promise<Db> {
  const db = openTestDb()
  await migrate(db)
  await db.runAsync(
    `insert into photos (id, organization_id, hive_id, storage_path, taken_at, local_main_uri, local_thumb_uri, upload_step, _on_server)
     values ('p', 'o', 'h', 'o/h/p.jpg', '2026-10-26', 'file:///p.jpg', 'file:///p.thumb.jpg', ?, ?)`,
    [step, onServer],
  )
  await db.runAsync(
    "insert into outbox (id, table_name, row_id, payload, next_attempt_at, created_at) values ('photos:p', 'photos', 'p', '{}', '', '')",
  )
  mockExisting.clear()
  mockExisting.add('file:///p.jpg')
  mockExisting.add('file:///p.thumb.jpg')
  return db
}

const step = (deleted = false): Step => ({
  entry: {
    id: 'photos:p',
    table_name: 'photos',
    row_id: 'p',
    payload: JSON.stringify({ deleted_at: deleted ? '2026-10-26T00:00:00.000Z' : null }),
    attempts: 0,
    created_at: '',
    on_server: 0,
  },
  payload: { deleted_at: null },
  final: true,
})

const recorder = (fail?: { path: string; status: number }) => {
  const paths: string[] = []
  const upload: Upload = async (path) => {
    paths.push(path)
    return fail && path === fail.path
      ? { error: { message: 'x' }, status: fail.status }
      : { error: null }
  }
  return { paths, upload }
}

const uploadStep = async (db: Db) =>
  (await db.getFirstAsync<{ upload_step: string }>('select upload_step from photos'))?.upload_step

describe('preparePhoto', () => {
  it('uploads the main file, then the thumbnail, then hands the row over', async () => {
    const db = await database()
    const { paths, upload } = recorder()
    expect(await preparePhoto(db, step(), { upload, allowed: true })).toEqual({ kind: 'row' })
    expect(paths).toEqual(['o/h/p.jpg', 'o/h/p.thumb.jpg'])
    expect(await uploadStep(db)).toBe('thumb')
  })

  it('resumes where it stopped', async () => {
    const db = await database('main')
    const { paths, upload } = recorder()
    await preparePhoto(db, step(), { upload, allowed: true })
    expect(paths).toEqual(['o/h/p.thumb.jpg'])
  })

  it('keeps the step reached when a file fails, with the reason in Spanish', async () => {
    const db = await database()
    const { upload } = recorder({ path: 'o/h/p.thumb.jpg', status: 403 })
    const outcome = await preparePhoto(db, step(), { upload, allowed: true })
    expect(outcome).toMatchObject({ kind: 'failed', status: 403 })
    expect(await uploadStep(db)).toBe('main')
  })

  it('waits for Wi-Fi unless allowed, and pushes only the row for an uploaded photo', async () => {
    const { upload } = recorder()
    expect(await preparePhoto(await database(), step(), { upload, allowed: false })).toEqual({
      kind: 'wait',
    })
    expect(
      await preparePhoto(await database('none', 1), step(), { upload, allowed: false }),
    ).toEqual({
      kind: 'row',
    })
  })

  it('waits out the undo window before dropping a deleted photo', async () => {
    const db = await database()
    const { upload } = recorder()
    const now = step(true)
    now.entry.payload = JSON.stringify({ deleted_at: new Date().toISOString() })
    expect(await preparePhoto(db, now, { upload, allowed: true })).toEqual({ kind: 'wait' })
  })

  it('drops a photo deleted before it ever reached the server, files included', async () => {
    const db = await database()
    const { paths, upload } = recorder()
    expect(await preparePhoto(db, step(true), { upload, allowed: true })).toEqual({ kind: 'done' })
    expect(paths).toEqual([])
    expect(await db.getFirstAsync('select count(*) as n from photos')).toEqual({ n: 0 })
    expect(await db.getFirstAsync('select count(*) as n from outbox')).toEqual({ n: 0 })
    expect(mockExisting.size).toBe(0)
  })
})
