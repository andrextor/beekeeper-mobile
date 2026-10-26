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
  // Recognition events are global: only the hook that started this session listens to them.
  const owner = useRef(false)
  // A start still waiting for permission or locales is forgotten by reset (Cancelar).
  const generation = useRef(0)
  const startRoom = useRef(room)

  const begin = (lang: string, onDevice: boolean) => {
    owner.current = true
    startRoom.current = room
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
    if (!owner.current) return
    const words = event.results[0]?.transcript ?? ''
    if (!event.isFinal) return setInterim(words)
    // What does not fit stops the dictation; the text is never cut later without saying so.
    const free = room - text.current.length - (text.current ? 1 : 0)
    if (words.length > free) {
      setError('No cabe más texto aquí. Usa lo dictado hasta ahora.')
      stop()
      return
    }
    text.current = join(text.current, words)
    setFinalText(text.current)
    setInterim('')
    session.current.silentEnds = 0
  })
  useSpeechRecognitionEvent('error', (event) => {
    if (!owner.current) return
    if (event.error === 'no-speech') {
      session.current.silentEnds += 1
      return
    }
    if (event.error === 'aborted') return
    session.current.userStopped = true
    setError(errors[event.error] ?? 'El dictado se detuvo. Toca el micrófono para seguir.')
  })
  useSpeechRecognitionEvent('end', () => {
    if (!owner.current) return
    if (shouldRestart(session.current, session.current.userStopped) && text.current.length < room) {
      session.current.restarts += 1
      ExpoSpeechRecognitionModule.start(
        startOptions(session.current.lang, session.current.onDevice),
      )
      return
    }
    owner.current = false
    setListening(false)
    setInterim('')
  })

  const start = async () => {
    if (preparing) return
    const mine = ++generation.current
    setPreparing(true)
    try {
      const next = await prepareRecognition(ExpoSpeechRecognitionModule, online)
      if (mine !== generation.current) return
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
    /** Under a tenth of the room this dictation started with is left. */
    nearlyFull: room - finalText.length < Math.min(1000, startRoom.current / 10),
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
    reset: () => {
      generation.current += 1
      if (owner.current && !session.current.userStopped) stop()
      // Late events of the closed session are not this sheet's any more.
      owner.current = false
      setListening(false)
      text.current = ''
      setFinalText('')
      setInterim('')
      setError(null)
      setPlan(null)
    },
  }
}
