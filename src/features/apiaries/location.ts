import * as Location from 'expo-location'

import { within } from '@/features/sync/server'

export type Reading = { latitude: number; longitude: number; altitude_m: number | null }

/** `denied`: ask again on the next tap · `blocked`: only Android settings can allow it. */
export type LocationResult =
  | { reading: Reading }
  | { problem: 'denied' | 'blocked' | 'off' }
  | { problem: 'no_fix'; last: Reading | null }

const round6 = (value: number) => Math.round(value * 1e6) / 1e6

function toReading({ coords }: Location.LocationObject): Reading {
  return {
    latitude: round6(coords.latitude),
    longitude: round6(coords.longitude),
    // GPS altitude is above the ellipsoid, tens of metres off sea level: a prefill to adjust.
    altitude_m: coords.altitude === null ? null : Math.round(coords.altitude),
  }
}

/** One GPS reading (no data signal needed), asking for what is missing on the way. */
export async function readLocation(): Promise<LocationResult> {
  let permission = await Location.getForegroundPermissionsAsync()
  if (permission.status !== 'granted' && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync()
  }
  if (permission.status !== 'granted') {
    return { problem: permission.canAskAgain ? 'denied' : 'blocked' }
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    try {
      // Android's own "turn on location" dialog.
      await Location.enableNetworkProviderAsync()
    } catch {
      return { problem: 'off' }
    }
  }
  try {
    const position = await within(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      20_000,
    )
    return { reading: toReading(position) }
  } catch {
    const last = await Location.getLastKnownPositionAsync().catch(() => null)
    return { problem: 'no_fix', last: last ? toReading(last) : null }
  }
}
