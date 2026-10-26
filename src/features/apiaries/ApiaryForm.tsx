import { Save } from 'lucide-react-native'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { TextField } from '@/components/ui/TextField'
import { messageFor } from '@/lib/errors'
import { fieldErrors } from '@/lib/form'
import { nameTaken } from '@/lib/text'
import { LocationField } from './LocationField'
import type { Apiary } from './queries'
import { type ApiaryDraft, type ApiaryFields, apiarySchema, emptyApiary } from './schema'

export function toDraft(apiary: Apiary): ApiaryDraft {
  return {
    name: apiary.name,
    farm_name: apiary.farm_name ?? '',
    place: apiary.place ?? '',
    latitude: apiary.latitude,
    longitude: apiary.longitude,
    altitude_m: apiary.altitude_m === null ? '' : String(apiary.altitude_m),
    flora_notes: apiary.flora_notes ?? '',
    water_source: apiary.water_source ?? '',
    notes: apiary.notes ?? '',
  }
}

type Props = {
  initial?: ApiaryDraft
  /** Names of the finca's other live apiaries (unique per finca, B3). */
  otherNames: readonly string[]
  /** The server's reason when Pendientes → Revisar opened the form (a repeated name). */
  nameError?: string
  onSave: (fields: ApiaryFields) => Promise<void>
}

/** Owner-only form; every B3 rule is checked here before the row reaches the outbox. */
export function ApiaryForm({ initial = emptyApiary, otherNames, nameError, onSave }: Props) {
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>(nameError ? { name: nameError } : {})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const set = <K extends keyof ApiaryDraft>(key: K, value: ApiaryDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    if (saving) return
    const result = apiarySchema.safeParse(draft)
    if (!result.success) return setErrors(fieldErrors(result.error))
    if (nameTaken(result.data.name, otherNames)) {
      return setErrors({ name: 'Ya tienes un apiario con ese nombre.' })
    }
    setErrors({})
    setFailure(null)
    setSaving(true)
    try {
      await onSave(result.data)
    } catch (e) {
      setFailure(messageFor(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TextField
        label="Nombre *"
        value={draft.name}
        onChangeText={(v) => set('name', v)}
        placeholder="Vallecito 1"
        maxLength={80}
        error={errors.name}
      />
      <TextField
        label="Finca"
        value={draft.farm_name}
        onChangeText={(v) => set('farm_name', v)}
        maxLength={80}
        error={errors.farm_name}
      />
      <TextField
        label="Lugar (municipio, vereda)"
        value={draft.place}
        onChangeText={(v) => set('place', v)}
        maxLength={120}
        error={errors.place}
      />
      <LocationField
        latitude={draft.latitude}
        longitude={draft.longitude}
        error={errors.latitude}
        onRead={(reading) =>
          setDraft((d) => ({
            ...d,
            latitude: reading.latitude,
            longitude: reading.longitude,
            altitude_m:
              d.altitude_m || reading.altitude_m === null
                ? d.altitude_m
                : String(reading.altitude_m),
          }))
        }
        onClear={() => setDraft((d) => ({ ...d, latitude: null, longitude: null }))}
      />
      <TextField
        label="Altitud (m)"
        value={draft.altitude_m}
        onChangeText={(v) => set('altitude_m', v)}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        error={errors.altitude_m}
      />
      <TextField
        label="Floración y cultivos cercanos"
        value={draft.flora_notes}
        onChangeText={(v) => set('flora_notes', v)}
        multiline
        maxLength={2000}
        error={errors.flora_notes}
      />
      <TextField
        label="Fuente de agua"
        value={draft.water_source}
        onChangeText={(v) => set('water_source', v)}
        maxLength={200}
        error={errors.water_source}
      />
      <TextField
        label="Notas"
        value={draft.notes}
        onChangeText={(v) => set('notes', v)}
        multiline
        maxLength={2000}
        error={errors.notes}
      />
      <FormError message={failure} />
      <Button icon={Save} label="Guardar" loading={saving} onPress={save} />
    </>
  )
}
