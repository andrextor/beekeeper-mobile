import { migrate } from '@/db/migrate'
import { openTestDb } from '@/db/test-db'
import { savePhoto } from './save'

describe('savePhoto', () => {
  it('stores the row with its local files and queues it', async () => {
    const db = openTestDb()
    await migrate(db)
    await savePhoto(db, {
      id: 'P-1',
      organizationId: 'O-1',
      hiveId: 'H-1',
      inspectionId: 'I-1',
      userId: 'u-1',
      takenAt: '2026-10-26T10:00:00.000Z',
      mainUri: 'file:///photos/P-1.jpg',
      thumbUri: 'file:///photos/P-1.thumb.jpg',
      width: 1600,
      height: 1200,
      bytes: 250_000,
    })
    expect(
      await db.getFirstAsync(
        'select storage_path, local_main_uri, upload_step, _on_server from photos',
      ),
    ).toEqual({
      storage_path: 'o-1/h-1/p-1.jpg',
      local_main_uri: 'file:///photos/P-1.jpg',
      upload_step: 'none',
      _on_server: 0,
    })
    expect(await db.getFirstAsync('select table_name, row_id from outbox')).toEqual({
      table_name: 'photos',
      row_id: 'P-1',
    })
  })
})
