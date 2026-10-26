import type { SupabaseClient } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

// Push and pull reach any synced table by name; the typed client cannot express that.
export const client = supabase as unknown as SupabaseClient

/** For calls that take no abort signal: give up waiting after `ms` (the call itself may go on). */
export function within<T>(promise: PromiseLike<T>, ms = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Network request failed: timeout')), ms)
  })
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

/** The server's current version of one row; `null` when it is gone or no longer readable. */
export async function fetchServerRow(
  table: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await withTimeout((signal) =>
    client.from(table).select('*').eq('id', id).abortSignal(signal).maybeSingle(),
  )
  if (error) throw error
  return data as Record<string, unknown> | null
}

/** A request that hangs on a weak signal is abandoned after 15 s and retried later. */
export async function withTimeout<T>(request: (signal: AbortSignal) => PromiseLike<T>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    return await request(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}
