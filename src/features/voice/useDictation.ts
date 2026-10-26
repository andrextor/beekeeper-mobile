import { useNetworkState } from 'expo-network'
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition'
import { useRef, useState } from 'react'

import { type Plan, prepareRecognition, shouldRestart, startOptions } from './recognition'

const errors: Readonly<Record<string, string>> = {
  'not-allowed': 'Necesitamos el micrófono para dictar.',
  network: 'Se perdió la señal. Para dictar sin señal, descarga el paquete de voz en español.',
  'language-not-supported': 'Este teléfono no reconoce español. Sigue con los toques.',
  'service-not-allowed': 'El dictado no está disponible en este teléfono.',
}

const join = (a: string, b: string) =>
  [a, b]
    .filter((t) => t.trim())
    .join(' ')
    .trim()

/**
 * One dictation: prepare (spec M8 steps 1–5), listen with interim text, restart on Android's
 * pauses within the caps, stop at `room` characters (the transcript column holds 10000).
 */
export function useDictation(room: number) {
  const network = useNetworkState()
  const online = network.isConnected !== false && network.isInternetReachable !== false
  const [plan, setPlan] = useState<Plan | null>(null)
  const [listening, setListening] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const session = useRef({
    restarts: 0,
    silentEnds: 0,
    userStopped: true,
    lang: 'es-CO',
    onDevice: false,
  })
  const text = useRef('')

  const begin = (lang: string, onDevice: boolean) => {
    session.current = { restarts: 0, silentEnds: 0, userStopped: false, lang, onDevice }
    setError(null)
    setListening(true)
    ExpoSpeechRecognitionModule.start(startOptions(lang, onDevice))
  }

  const stop = () => {
    session.current.userStopped = true
    ExpoSpeechRecognitionModule.stop()
  }

  useSpeechRecognitionEvent('result', (event) => {
    const words = event.results[0]?.transcript ?? ''
    if (!event.isFinal) return setInterim(words)
    text.current = join(text.current, words)
    setFinalText(text.current)
    setInterim('')
    session.current.silentEnds = 0
    if (text.current.length >= room) stop()
  })
  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'no-speech') {
      session.current.silentEnds += 1
      return
    }
    if (event.error === 'aborted') return
    session.current.userStopped = true
    setError(errors[event.error] ?? 'El dictado se detuvo. Toca el micrófono para seguir.')
  })
  useSpeechRecognitionEvent('end', () => {
    if (shouldRestart(session.current, session.current.userStopped) && text.current.length < room) {
      session.current.restarts += 1
      ExpoSpeechRecognitionModule.start(
        startOptions(session.current.lang, session.current.onDevice),
      )
      return
    }
    setListening(false)
    setInterim('')
  })

  const start = async () => {
    if (preparing) return
    setPreparing(true)
    try {
      const next = await prepareRecognition(ExpoSpeechRecognitionModule, online)
      setPlan(next)
      if (next.kind === 'ready') begin(next.lang, next.onDevice)
    } catch {
      setError('No pudimos iniciar el dictado. Sigue con los toques.')
    } finally {
      setPreparing(false)
    }
  }

  return {
    plan,
    listening,
    preparing,
    finalText,
    interim,
    error,
    /** Few characters left in this inspection's transcript. */
    nearlyFull: room - finalText.length < 1000,
    start,
    stop,
    /** Without signal and no pack detected (Android ≤ 12 cannot tell): try on-device anyway. */
    tryOnDevice: () => plan?.kind === 'needs_offline_pack' && begin(plan.lang, true),
    downloadPack: async () => {
      if (plan?.kind !== 'needs_offline_pack') return
      try {
        await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: plan.lang })
      } catch {
        setError('Descárgalo en Ajustes › Google › Voz › Reconocimiento sin conexión › Español.')
      }
    },
    setText: (value: string) => {
      text.current = value
      setFinalText(value)
    },
    reset: () => {
      if (!session.current.userStopped) stop()
      text.current = ''
      setFinalText('')
      setInterim('')
      setError(null)
      setPlan(null)
    },
  }
}
