import { LocateFixed, Settings, X } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { type LocationResult, type Reading, readLocation } from './location'

type Props = {
  latitude: number | null
  longitude: number | null
  error?: string
  onRead: (reading: Reading) => void
  onClear: () => void
}

const problems: Record<Exclude<LocationResult, { reading: Reading }>['problem'], string> = {
  denied: 'Sin permiso de ubicación. Toca el botón otra vez para permitirla.',
  blocked: 'La ubicación está desactivada para Landak Apiario.',
  off: 'La ubicación del teléfono está apagada. Actívala y vuelve a intentar.',
  no_fix: 'No encontramos señal GPS. Sal a cielo abierto y vuelve a intentar.',
}

/** "Usar mi ubicación", always one tap away: no dead end when permission or GPS is off. */
export function LocationField({ latitude, longitude, error, onRead, onClear }: Props) {
  const [reading, setReading] = useState(false)
  const [result, setResult] = useState<LocationResult | null>(null)
  const saved = latitude !== null && longitude !== null

  const read = async () => {
    setReading(true)
    setResult(null)
    try {
      const outcome = await readLocation()
      if ('reading' in outcome) onRead(outcome.reading)
      else setResult(outcome)
    } catch {
      setResult({ problem: 'no_fix', last: null })
    } finally {
      setReading(false)
    }
  }

  const problem = result && 'problem' in result ? result : null
  const last = problem?.problem === 'no_fix' ? problem.last : null

  return (
    <Card className="gap-3">
      <Text className="font-sans-semibold text-body text-text">Ubicación</Text>
      <Text className="font-sans text-body text-muted">
        {saved ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'Sin ubicación'}
      </Text>
      <Button
        icon={LocateFixed}
        label={
          reading ? 'Buscando señal GPS…' : saved ? 'Actualizar ubicación' : 'Usar mi ubicación'
        }
        loading={reading}
        onPress={read}
      />
      {problem ? <FormError message={problems[problem.problem]} /> : null}
      {problem?.problem === 'blocked' || problem?.problem === 'off' ? (
        <Button
          variant="secondary"
          icon={Settings}
          label="Abrir ajustes"
          onPress={() =>
            void (problem.problem === 'off'
              ? Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS')
              : Linking.openSettings())
          }
        />
      ) : null}
      {last ? (
        <Button
          variant="secondary"
          label="Usar la última ubicación conocida"
          onPress={() => {
            onRead(last)
            setResult(null)
          }}
        />
      ) : null}
      <FormError message={error ?? null} />
      {saved ? (
        <View className="flex-row">
          <Button variant="secondary" icon={X} label="Quitar ubicación" onPress={onClear} />
        </View>
      ) : null}
    </Card>
  )
}
