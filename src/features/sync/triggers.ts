import { addNetworkStateListener } from 'expo-network'
import { useEffect } from 'react'
import { AppState } from 'react-native'

import { getDb } from '@/db/database'
import { onLocalWrite } from '@/db/write'
import { messageFor } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import { singleFlight } from './engine'
import { pull } from './pull'
import { pushOutbox } from './push'

export type RunStatus = { running: boolean; error: string | null }

let status: RunStatus = { running: false, error: null }
const watchers = new Set<() => void>()

function setStatus(next: Partial<RunStatus>) {
  status = { ...status, ...next }
  for (const watch of watchers) watch()
}

export const runStatus = {
  get: (): RunStatus => status,
  subscribe(watch: () => void): () => void {
    watchers.add(watch)
    return () => watchers.delete(watch)
  },
}

/** Pushes first so the pull brings back the server's version of what was just sent. */
export const requestSync = singleFlight(async (mode) => {
  const { data } = await supabase.auth.getSession()
  // Signed out, or a refresh refused for good: pushing waits for the same person to sign in.
  if (!data.session) return
  setStatus({ running: true })
  try {
    const db = await getDb()
    await pushOutbox(db)
    if (mode === 'full') await pull(db)
    setStatus({ error: null })
  } catch (error) {
    setStatus({ error: messageFor(error) })
  } finally {
    setStatus({ running: false })
  }
})

const debounceMs = 3_000
const foregroundEveryMs = 2 * 60_000

/** Mounted while signed in with a finca: start, reconnect, 3 s after a save, every 2 min in front. */
export function useSyncTriggers(): void {
  useEffect(() => {
    void requestSync('full')

    let online: boolean | null = null
    const network = addNetworkStateListener(({ isConnected, isInternetReachable }) => {
      const now = isConnected !== false && isInternetReachable !== false
      if (now && online === false) void requestSync('full')
      online = now
    })

    let debounce: ReturnType<typeof setTimeout> | null = null
    const stopWrites = onLocalWrite(() => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => void requestSync('push'), debounceMs)
    })

    let timer: ReturnType<typeof setInterval> | null = null
    const startTimer = () => {
      timer ??= setInterval(() => void requestSync('full'), foregroundEveryMs)
    }
    const stopTimer = () => {
      if (timer) clearInterval(timer)
      timer = null
    }
    if (AppState.currentState === 'active') startTimer()
    const appState = AppState.addEventListener('change', (state) =>
      state === 'active' ? startTimer() : stopTimer(),
    )

    return () => {
      network.remove()
      stopWrites()
      appState.remove()
      stopTimer()
      if (debounce) clearTimeout(debounce)
    }
  }, [])
}
