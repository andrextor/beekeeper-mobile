import { getDb } from '@/db/database'
import type { LabelHive } from './label-html'

/** Every live hive of the apiary, by name: the A4 sheet's content. */
export async function apiaryLabels(apiaryId: string): Promise<LabelHive[]> {
  const db = await getDb()
  return db.getAllAsync<LabelHive>(
    'select name, qr_code from hives where apiary_id = ? and deleted_at is null order by name collate nocase',
    [apiaryId],
  )
}
