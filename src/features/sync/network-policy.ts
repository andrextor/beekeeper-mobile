import { getNetworkStateAsync, NetworkStateType } from 'expo-network'

import type { Db } from '@/db/db'

export const mobileDataSetting = 'photos_on_mobile_data'

/** Spec M9 → Network policy: rows on any connection; photo files on Wi-Fi unless allowed. */
export function canUploadPhotos(
  onWifi: boolean,
  mobileDataAllowed: boolean,
  once: boolean,
): boolean {
  return onWifi || mobileDataAllowed || once
}

let uploadOnce = false

/** "Subir ahora con datos": the next run uploads photos on mobile data, without changing the setting. */
export function allowMobileDataOnce(): void {
  uploadOnce = true
}

export async function readSetting(db: Db, key: string): Promise<string | null> {
  return (
    (await db.getFirstAsync<{ value: string }>('select value from settings where key = ?', [key]))
      ?.value ?? null
  )
}

export async function writeSetting(db: Db, key: string, value: string): Promise<void> {
  await db.transaction(async () => {
    await db.runAsync(
      'insert into settings (key, value) values (?, ?) on conflict (key) do update set value = excluded.value',
      [key, value],
    )
  })
}

/** Decided once per sync run; the one-time permission is used up by it. */
export async function photoUploadAllowed(db: Db): Promise<boolean> {
  const state = await getNetworkStateAsync().catch(() => null)
  const once = uploadOnce
  uploadOnce = false
  return canUploadPhotos(
    state?.type === NetworkStateType.WIFI,
    (await readSetting(db, mobileDataSetting)) === '1',
    once,
  )
}
