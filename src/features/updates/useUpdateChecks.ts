import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { z } from 'zod'

import { latestJsonUrl } from '@/lib/releases'
import { dueForCheck, isNewer } from './check'

const latestSchema = z.object({ version: z.string(), apkUrl: z.url({ protocol: /^https$/ }) })

export type NewApk = z.infer<typeof latestSchema>

async function fetchOta(): Promise<void> {
  if (!Updates.isEnabled) return
  const result = await Updates.checkForUpdateAsync()
  if (result.isAvailable) await Updates.fetchUpdateAsync()
}

async function fetchNewApk(): Promise<NewApk | null> {
  const response = await fetch(latestJsonUrl)
  if (!response.ok) return null
  const latest = latestSchema.safeParse(await response.json())
  const current = Constants.expoConfig?.version ?? ''
  return latest.success && isNewer(latest.data.version, current) ? latest.data : null
}

/**
 * On start and when the app comes back, at most once an hour: downloads a JS update (applied on
 * "Reiniciar") and reads `latest.json` for a new APK. Never restarts the app by itself.
 */
export function useUpdateChecks(): { otaReady: boolean; newApk: NewApk | null } {
  const { isUpdatePending } = Updates.useUpdates()
  const [newApk, setNewApk] = useState<NewApk | null>(null)
  const lastCheck = useRef(0)

  useEffect(() => {
    const check = () => {
      const now = Date.now()
      if (!dueForCheck(lastCheck.current, now)) return
      lastCheck.current = now
      // No signal or no release yet: try again next hour.
      void fetchOta().catch(() => {})
      void fetchNewApk()
        .then(setNewApk)
        .catch(() => {})
    }
    check()
    const subscription = AppState.addEventListener('change', (s) => s === 'active' && check())
    return () => subscription.remove()
  }, [])

  return { otaReady: isUpdatePending, newApk }
}
