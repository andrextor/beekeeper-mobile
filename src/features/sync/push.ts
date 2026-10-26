import type { SupabaseClient } from '@supabase/supabase-js'

import type { Db } from '@/db/db'
import type { SyncedTable } from '@/db/mapping'
import { applyServerRows } from '@/db/write'
import { errorCode, messageFor } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { classify, retryDelayMs } from './classify'
import { type OutboxEntry, pushSteps, type Step } from './order'

// The pusher writes any synced table by name; the typed client cannot express that.
const client = supabase as unknown as SupabaseClient

const timeoutMs = 15_000

type Answer = { data: unknown; error: unknown; status: number }

let forcedFailure = false

/** Dev panel: while on, every push fails as if there were no signal. */
export function setForcedFailure(on: boolean): void {
  forcedFailure = on
}

async function send(table: SyncedTable, payload: Record<string, unknown>): Promise<Answer> {
  if (forcedFailure) return { data: null, error: { message: 'Fallo forzado' }, status: 0 }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const { data, error, status } = await client
      .from(table)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .abortSignal(controller.signal)
      .single()
    return { data, error, status }
  } finally {
    clearTimeout(timer)
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
  return false
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

  const verdict = classify(
    answer.error,
    answer.status,
    (await onServer(db, table, entry.row_id)) === 1,
  )
  const message = messageFor(answer.error)
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
  await db.transaction(async () => {
    if (verdict === 'drop') {
      const { changes } = await db.runAsync('delete from outbox where id = ? and payload = ?', [
        entry.id,
        entry.payload,
      ])
      if (changes) await db.runAsync(`update ${table} set _dirty = 0 where id = ?`, [entry.row_id])
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

/** Pushes every due outbox entry in order (spec → Outbox), one row per request. */
export async function pushOutbox(db: Db): Promise<void> {
  const entries = await db.getAllAsync<OutboxEntry>(
    `select o.id, o.table_name, o.row_id, o.payload, o.attempts, o.created_at,
       coalesce(a._on_server, h._on_server, i._on_server, e._on_server, 0) as on_server
     from outbox o
     left join apiaries a on o.table_name = 'apiaries' and a.id = o.row_id
     left join hives h on o.table_name = 'hives' and h.id = o.row_id
     left join inspections i on o.table_name = 'inspections' and i.id = o.row_id
     left join hive_events e on o.table_name = 'hive_events' and e.id = o.row_id
     where o.state = 'pending' and o.next_attempt_at <= ? and o.table_name != 'photos'`,
    // ponytail: photos wait for M9's uploader (file → thumbnail → row).
    [new Date().toISOString()],
  )
  for (const step of pushSteps(entries)) {
    if (await mustWait(db, step)) continue
    const answer = await send(step.entry.table_name, step.payload)
    if ((await settle(db, step, answer, new Date())) === 'stop') return
  }
}
