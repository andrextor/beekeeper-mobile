import type { SupabaseClient } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

// Push and pull reach any synced table by name; the typed client cannot express that.
export const client = supabase as unknown as SupabaseClient

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
