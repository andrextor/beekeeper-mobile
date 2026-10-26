import { maxRestarts, prepareRecognition, type Recognizer, shouldRestart } from './recognition'

function fake(
  overrides: Partial<{
    available: boolean
    granted: boolean
    locales: string[]
    installed: string[]
    onDevice: boolean
  }> = {},
): Recognizer {
  const o = {
    available: true,
    granted: true,
    locales: ['en-US', 'es-ES', 'es-CO'],
    installed: [],
    onDevice: true,
    ...overrides,
  }
  return {
    isRecognitionAvailable: () => o.available,
    requestPermissionsAsync: async () =>
      ({
        granted: o.granted,
        canAskAgain: false,
        status: o.granted ? 'granted' : 'denied',
        expires: 'never',
      }) as never,
    getSupportedLocales: async () => ({ locales: o.locales, installedLocales: o.installed }),
    supportsOnDeviceRecognition: () => o.onDevice,
  }
}

describe('prepareRecognition', () => {
  it('prefers Colombian Spanish installed on the phone, then other Spanish', async () => {
    expect(await prepareRecognition(fake({ installed: ['es-ES', 'es-CO'] }), false)).toEqual({
      kind: 'ready',
      lang: 'es-CO',
      onDevice: true,
    })
    expect(await prepareRecognition(fake({ installed: ['es-MX', 'es-ES'] }), false)).toEqual({
      kind: 'ready',
      lang: 'es-ES',
      onDevice: true,
    })
  })

  it('uses the online recognizer with signal when no pack is installed', async () => {
    expect(await prepareRecognition(fake(), true)).toEqual({
      kind: 'ready',
      lang: 'es-CO',
      onDevice: false,
    })
  })

  it('asks for the offline pack before listening when there is no signal and no pack', async () => {
    expect(await prepareRecognition(fake(), false)).toEqual({
      kind: 'needs_offline_pack',
      lang: 'es-CO',
    })
  })

  it('says when dictation cannot work at all', async () => {
    expect(await prepareRecognition(fake({ available: false }), true)).toEqual({
      kind: 'unavailable',
    })
    expect(await prepareRecognition(fake({ granted: false }), true)).toEqual({
      kind: 'denied',
      canAskAgain: false,
    })
  })
})

describe('shouldRestart', () => {
  it('restarts until Detener, 20 times at most, and stops after 3 silences in a row', () => {
    expect(shouldRestart({ restarts: 0, silentEnds: 0 }, false)).toBe(true)
    expect(shouldRestart({ restarts: 0, silentEnds: 0 }, true)).toBe(false)
    expect(shouldRestart({ restarts: maxRestarts, silentEnds: 0 }, false)).toBe(false)
    expect(shouldRestart({ restarts: 3, silentEnds: 3 }, false)).toBe(false)
  })
})
