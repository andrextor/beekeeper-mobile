import { File } from 'expo-file-system'

import type { Db } from '@/db/db'
import type { SyncedTable } from '@/db/mapping'
import { applyServerRows } from '@/db/write'
import { errorCode, messageFor } from '@/lib/errors'
import { isRecord } from '@/lib/guards'
import { newQrCode } from '@/lib/qr-code'
import { classify, retryDelayMs } from './classify'
import { removeLocal } from './discard'
import { photoUploadAllowed } from './network-policy'
import { type OutboxEntry, pushSteps, type Step } from './order'
import { preparePhoto } from './push-photos'
import { replaceTakenQrCode } from './relabel'
import { client, fetchServerRow, withTimeout, within } from './server'

/** `message` replaces the generic Spanish text (Storage errors carry none of ours). */
type Answer = { data: unknown; error: unknown; status: number; message?: string }

let forcedFailure = false

/** Dev panel: while on, every push fails as if there were no signal. */
export function setForcedFailure(on: boolean): void {
  forcedFailure = on
}

/** One Storage upload; `upsert` lets a retry overwrite this person's own file (B5). */
async function uploadFile(
  path: string,
  localUri: string,
): Promise<{ error: unknown; status?: number }> {
  try {
    const body = await new File(localUri).arrayBuffer()
    const { error } = await within(
      client.storage
        .from('hive-photos')
        .upload(path, body, { contentType: 'image/jpeg', upsert: true }),
      60_000,
    )
    const status = isRecord(error) && typeof error.status === 'number' ? error.status : undefined
    return { error, status }
  } catch (error) {
    return { error, status: undefined }
  }
}

async function send(table: SyncedTable, payload: Record<string, unknown>): Promise<Answer> {
  if (forcedFailure) return { data: null, error: { message: 'Fallo forzado' }, status: 0 }
  try {
    const { data, error, status } = await withTimeout((signal) =>
      client
        .from(table)
        .upsert(payload, { onConflict: 'id' })
        .select()
        .abortSignal(signal)
        .single(),
    )
    return { data, error, status }
  } catch (error) {
    return { data: null, error, status: 0 }
  }
}

const parents: Record<SyncedTable, [SyncedTable, string][]> = {
  apiaries: [],
  hives: [['apiaries', 'apiary_id']],
  inspections: [['hives', 'hive_id']],
  hive_events: [
    ['hives', 'hive_id'],
    ['inspections', 'inspection_id'],
  ],
  photos: [
    ['hives', 'hive_id'],
    ['inspections', 'inspection_id'],
  ],
}

async function onServer(db: Db, table: SyncedTable, id: unknown): Promise<number | null> {
  if (typeof id !== 'string') return null
  const row = await db.getFirstAsync<{ _on_server: number }>(
    `select _on_server from ${table} where id = ?`,
    [id],
  )
  return row?._on_server ?? null
}

/** Pushing now would only earn an error that waiting avoids (spec → Outbox → Order). */
async function mustWait(db: Db, { entry, payload }: Step): Promise<boolean> {
  if (payload.deleted_at != null) {
    if ((await onServer(db, entry.table_name, entry.row_id)) === 0) return true
    if (entry.table_name !== 'apiaries') return false
    const hive = await db.getFirstAsync(
      `select 1 from outbox where table_name = 'hives' and json_extract(payload, '$.apiary_id') = ?`,
      [entry.row_id],
    )
    return hive !== null
  }
  for (const [table, column] of parents[entry.table_name]) {
    if ((await onServer(db, table, payload[column])) === 0) return true
  }
  // A photo taken in field mode waits for Terminar: its inspection is still a draft (no row).
  if (
    entry.table_name === 'photos' &&
    typeof payload.inspection_id === 'string' &&
    (await onServer(db, 'inspections', payload.inspection_id)) === null
  ) {
    return true
  }
  // A relabel event never reaches the server before the code it announces.
  if (entry.table_name === 'hive_events' && payload.type === 'qr_relabel') {
    const hive = await db.getFirstAsync(
      "select 1 from outbox where table_name = 'hives' and row_id = ?",
      [typeof payload.hive_id === 'string' ? payload.hive_id : ''],
    )
    return hive !== null
  }
  return false
}

async function settle(db: Db, step: Step, answer: Answer, now: Date): Promise<'go' | 'stop'> {
  const { entry } = step
  const table = entry.table_name
  if (!answer.error) {
    await db.transaction(async () => {
      // A payload that changed in flight is a newer edit: it keeps its entry and goes next run.
      const done =
        step.final &&
        (
          await db.runAsync('delete from outbox where id = ? and payload = ?', [
            entry.id,
            entry.payload,
          ])
        ).changes > 0
      if (done && isRecord(answer.data)) await applyServerRows(db, table, [answer.data], true)
      else
        await db.runAsync(
          `update ${table} set _on_server = 1${done ? ', _dirty = 0' : ''} where id = ?`,
          [entry.row_id],
        )
    })
    return 'go'
  }

  const rowOnServer = (await onServer(db, table, entry.row_id)) === 1
  if (table === 'hives' && !rowOnServer && errorCode(answer.error) === 'qr_taken') {
    if (await replaceTakenQrCode(db, entry.row_id, newQrCode())) return 'go'
  }
  const verdict = classify(answer.error, answer.status, rowOnServer)
  const message = answer.message ?? messageFor(answer.error)
  const code = errorCode(answer.error) ?? String(answer.status)
  if (verdict === 'retry') {
    const next = new Date(now.getTime() + retryDelayMs(entry.attempts + 1)).toISOString()
    await db.transaction(async () => {
      await db.runAsync(
        `update outbox set attempts = attempts + 1, next_attempt_at = ?, last_error = ?,
         last_error_code = ? where id = ?`,
        [next, message, code, entry.id],
      )
    })
    // No signal or a struggling server: the rest of the queue would fail the same way.
    return 'stop'
  }
  // A dropped edit never reached the server: show the server's version again, not the edit.
  const serverRow =
    verdict === 'drop' ? await fetchServerRow(table, entry.row_id).catch(() => null) : null
  await db.transaction(async () => {
    if (verdict === 'drop') {
      const { changes } = await db.runAsync('delete from outbox where id = ? and payload = ?', [
        entry.id,
        entry.payload,
      ])
      if (!changes) return
      if (serverRow) await applyServerRows(db, table, [serverRow], true)
      else await db.runAsync(`update ${table} set _dirty = 0 where id = ?`, [entry.row_id])
      return
    }
    await db.runAsync(
      `update outbox set state = 'failed_permanent', attempts = attempts + 1, last_error = ?,
       last_error_code = ? where id = ? and payload = ?`,
      [message, code, entry.id, entry.payload],
    )
  })
  return 'go'
}

/** "Sincronizar ahora" and a reconnect do not wait out the backoff. */
export async function retryNow(db: Db): Promise<void> {
  await db.transaction(async () => {
    await db.runAsync("update outbox set next_attempt_at = ? where state = 'pending'", [
      new Date().toISOString(),
    ])
  })
}

/**
 * A photo of a field draft that no longer exists (discarded, and the app closed before its photos
 * were removed): neither the inspection nor the draft is on the phone, so it would wait forever.
 */
async function orphanPhoto(db: Db, { entry, payload }: Step): Promise<boolean> {
  const inspectionId = payload.inspection_id
  if (typeof inspectionId !== 'string') return false
  const parent = await db.getFirstAsync(
    `select 1 from inspections where id = ?
     union all select 1 from inspection_drafts where id = ?`,
    [inspectionId, inspectionId],
  )
  if (parent || (await onServer(db, 'photos', entry.row_id)) !== 0) return false
  await db.transaction(() => removeLocal(db, 'photos', entry.row_id))
  return true
}

/** Pushes every due outbox entry in order (spec → Outbox), one row per request. */
export async function pushOutbox(db: Db): Promise<void> {
  const entries = await db.getAllAsync<OutboxEntry>(
    `select o.id, o.table_name, o.row_id, o.payload, o.attempts, o.created_at,
       coalesce(a._on_server, h._on_server, i._on_server, e._on_server, p._on_server, 0) as on_server
     from outbox o
     left join apiaries a on o.table_name = 'apiaries' and a.id = o.row_id
     left join hives h on o.table_name = 'hives' and h.id = o.row_id
     left join inspections i on o.table_name = 'inspections' and i.id = o.row_id
     left join hive_events e on o.table_name = 'hive_events' and e.id = o.row_id
     left join photos p on o.table_name = 'photos' and p.id = o.row_id
     where o.state = 'pending' and o.next_attempt_at <= ?`,
    [new Date().toISOString()],
  )
  const photosAllowed = await photoUploadAllowed(db)
  // An entry dropped by an earlier step (a photo deleted before upload) has nothing left to push.
  const dropped = new Set<string>()
  for (const step of pushSteps(entries)) {
    if (dropped.has(step.entry.id)) continue
    const photo = step.entry.table_name === 'photos'
    if (photo && (await orphanPhoto(db, step))) {
      dropped.add(step.entry.id)
      continue
    }
    if (await mustWait(db, step)) continue
    if (photo) {
      const prepared = await preparePhoto(db, step, { upload: uploadFile, allowed: photosAllowed })
      if (prepared.kind === 'wait') continue
      if (prepared.kind === 'done') {
        dropped.add(step.entry.id)
        continue
      }
      if (prepared.kind === 'failed') {
        const failure = {
          data: null,
          error: prepared.error,
          status: prepared.status ?? 0,
          message: prepared.message,
        }
        if ((await settle(db, step, failure, new Date())) === 'stop') return
        continue
      }
    }
    const answer = await send(step.entry.table_name, step.payload)
    if (photo && !answer.error) {
      await db.transaction(async () => {
        await db.runAsync("update photos set upload_step = 'row' where id = ?", [step.entry.row_id])
      })
    }
    if ((await settle(db, step, answer, new Date())) === 'stop') return
  }
}
