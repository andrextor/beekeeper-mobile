import { getDb } from '@/db/database'
import { relabelHive } from '@/features/sync/relabel'
import { exclusive } from '@/features/sync/triggers'

/**
 * Puts `code` on the hive (one transaction with its `qr_relabel` event). Returns the reason in
 * Spanish when the phone already knows the code is not free; the server has the final word
 * (`qr_taken` → Pendientes → "Generar otro código").
 */
export async function assignCode(hiveId: string, code: string): Promise<string | null> {
  const db = await getDb()
  const holder = await db.getFirstAsync<{ id: string; name: string }>(
    'select id, name from hives where qr_code = ? and deleted_at is null',
    [code],
  )
  if (holder?.id === hiveId) return 'Esa ya es la etiqueta de esta colmena.'
  if (holder) return `Ese código ya es de la colmena ${holder.name}.`
  let saved = false
  await exclusive(async () => {
    saved = await relabelHive(db, hiveId, code)
  })
  return saved ? null : 'Esta colmena ya no existe.'
}
