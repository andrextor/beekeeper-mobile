import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { useEffect, useState } from 'react'
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

// Module level: a remount of Inicio (finca switch, sign-in) must not check again within the hour.
let lastCheck = 0
let checking = false
let found: NewApk | null = null

/**
 * Semver is enough: every PR bumps `expo.version`, and an OTA only reaches a binary with the same
 * native fingerprint, so an OTA never carries the version of an APK with newer native code.
 */
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
  const [newApk, setNewApk] = useState<NewApk | null>(found)

  useEffect(() => {
    const check = async () => {
      if (checking || !dueForCheck(lastCheck, Date.now())) return
      checking = true
      try {
        found = await fetchNewApk()
        setNewApk(found)
        await fetchOta()
        lastCheck = Date.now()
      } catch {
        // No signal: the next time the app comes to the front tries again.
      } finally {
        checking = false
      }
    }
    void check()
    const subscription = AppState.addEventListener('change', (s) => {
      if (s === 'active') void check()
    })
    return () => subscription.remove()
  }, [])

  return { otaReady: isUpdatePending, newApk }
}
