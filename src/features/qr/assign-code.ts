import { getDb } from '@/db/database'
import { relabelHive } from '@/features/sync/relabel'
import { exclusive } from '@/features/sync/triggers'
import { isQrCode } from '@/lib/qr-code'
import { findLocal } from './lookup'

/**
 * Puts `code` on the hive (one transaction with its `qr_relabel` event). Returns the reason in
 * Spanish when the code is malformed or the phone already knows it is not free; the server has
 * the final word (`qr_taken` → Pendientes → "Generar otro código").
 */
export async function assignCode(hiveId: string, code: string): Promise<string | null> {
  if (!isQrCode(code)) return 'Ese código no es válido.'
  const db = await getDb()
  const holder = await findLocal(db, code)
  if (holder?.id === hiveId) return 'Esa ya es la etiqueta de esta colmena.'
  if (holder) {
    const name = await db.getFirstAsync<{ name: string }>('select name from hives where id = ?', [
      holder.id,
    ])
    return `Ese código ya es de la colmena ${name?.name ?? 'otra'}.`
  }
  let saved = false
  await exclusive(async () => {
    saved = await relabelHive(db, hiveId, code)
  })
  return saved ? null : 'Esta colmena ya no existe.'
}
