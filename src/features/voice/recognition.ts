import type {
  ExpoSpeechRecognitionModule,
  ExpoSpeechRecognitionOptions,
} from 'expo-speech-recognition'

/** The calls this app makes; tests pass a fake. */
export type Recognizer = Pick<
  typeof ExpoSpeechRecognitionModule,
  | 'isRecognitionAvailable'
  | 'requestPermissionsAsync'
  | 'getSupportedLocales'
  | 'supportsOnDeviceRecognition'
>

export type Plan =
  | { kind: 'ready'; lang: string; onDevice: boolean }
  | { kind: 'unavailable' }
  | { kind: 'denied'; canAskAgain: boolean }
  /** Offline and no Spanish pack installed (or Android ≤ 12, which cannot tell). */
  | { kind: 'needs_offline_pack'; lang: string }

const preferred = ['es-CO', 'es-419', 'es-US', 'es-ES', 'es-MX']

const spanish = (list: readonly string[]) =>
  preferred.find((l) => list.includes(l)) ?? list.find((l) => l.toLowerCase().startsWith('es'))

/** Spec M8 → Recognition setup, steps 1–5: availability, permission, locale, on-device or online. */
export async function prepareRecognition(recognizer: Recognizer, online: boolean): Promise<Plan> {
  if (!recognizer.isRecognitionAvailable()) return { kind: 'unavailable' }
  const permission = await recognizer.requestPermissionsAsync()
  if (!permission.granted) return { kind: 'denied', canAskAgain: permission.canAskAgain }
  let locales: { locales: string[]; installedLocales: string[] } = {
    locales: [],
    installedLocales: [],
  }
  try {
    locales = await recognizer.getSupportedLocales({})
  } catch {
    // Android ≤ 12 or a service that cannot list them: decide on connectivity alone.
  }
  const installed = spanish(locales.installedLocales)
  if (installed && recognizer.supportsOnDeviceRecognition()) {
    return { kind: 'ready', lang: installed, onDevice: true }
  }
  const lang = spanish(locales.locales) ?? 'es-CO'
  return online ? { kind: 'ready', lang, onDevice: false } : { kind: 'needs_offline_pack', lang }
}

export function startOptions(lang: string, onDevice: boolean): ExpoSpeechRecognitionOptions {
  return {
    lang,
    interimResults: true,
    continuous: true,
    addsPunctuation: true,
    requiresOnDeviceRecognition: onDevice,
    // Field pauses are long (hands in the hive): wait 4 s of silence before closing.
    androidIntentOptions: { EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 4000 },
  }
}

export type Restarts = { restarts: number; silentEnds: number }

export const maxRestarts = 20
const maxSilentEnds = 3

/**
 * Android < 13 ignores `continuous`: the recognizer ends after a pause and is restarted until the
 * person taps Detener; at most 20 times per dictation, and never after 3 silences in a row.
 */
export function shouldRestart(state: Restarts, userStopped: boolean): boolean {
  return !userStopped && state.restarts < maxRestarts && state.silentEnds < maxSilentEnds
}
