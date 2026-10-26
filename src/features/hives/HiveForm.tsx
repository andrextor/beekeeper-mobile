import { Save } from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ChipSelect } from '@/components/field/ChipSelect'
import { StepperField } from '@/components/field/StepperField'
import { TriStateField } from '@/components/field/TriStateField'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { messageFor } from '@/lib/errors'
import { fieldErrors } from '@/lib/form'
import {
  colonyOriginLabels,
  hiveStatusLabels,
  hiveTypeLabels,
  queenOriginLabels,
} from '@/lib/labels'
import { suggestQueenColor } from '@/lib/queen-color'
import { nameTaken } from '@/lib/text'
import { ColonyStartField } from './ColonyStartField'
import { nextHiveName } from './next-name'
import { QueenColorField } from './QueenColorField'
import { type Hive, useHiveNames } from './queries'
import { type HiveDraft, type HiveFields, hiveSchema, localDay } from './schema'

const marked = { yes: 'Sí', no: 'No', unknown: 'No sé' } as const
const races = ['Africanizada', 'Italiana', 'Carniola']

export function toDraft(hive: Hive): HiveDraft {
  return {
    name: hive.name,
    apiary_id: hive.apiary_id,
    hive_type: hive.hive_type,
    brood_boxes: hive.brood_boxes,
    supers: hive.supers,
    colony_origin: hive.colony_origin,
    colony_started_on: hive.colony_started_on,
    bee_race: hive.bee_race ?? '',
    queen_year: hive.queen_year,
    queen_marked: hive.queen_marked,
    queen_color: hive.queen_color,
    queen_origin: hive.queen_origin,
    status: hive.status,
    notes: hive.notes ?? '',
  }
}

type Props = {
  initial: HiveDraft
  /** Set when editing: this hive's own name does not count as taken. */
  hiveId?: string
  /** The finca's live apiaries; moving a hive is choosing another one. */
  apiaries: readonly { id: string; name: string }[]
  /** The server's reason when Pendientes → Revisar opened the form (a repeated name). */
  nameError?: string
  onSave: (fields: HiveFields) => Promise<void>
  /** Below the form, above the fixed save bar (the edit screen's delete button). */
  footer?: ReactNode
  title: string
  header: ReactNode
}

const single = (value: string | null) => (value ? [value] : [])

/** Owner-only, gloves-first: steppers and chips for everything except names and notes. */
export function HiveForm({
  initial,
  hiveId,
  apiaries,
  nameError,
  onSave,
  footer,
  title,
  header,
}: Props) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState(initial)
  const [nameTouched, setNameTouched] = useState(Boolean(hiveId))
  // Editing keeps what was saved, "Sin marca" included: the year only suggests on a new hive.
  const [colorTouched, setColorTouched] = useState(Boolean(hiveId) || initial.queen_color !== null)
  const [errors, setErrors] = useState<Record<string, string>>(nameError ? { name: nameError } : {})
  const [failure, setFailure] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof HiveDraft>(key: K, value: HiveDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const { names, loading: namesLoading } = useHiveNames(draft.apiary_id)
  const siblings = names.filter((h) => h.id !== hiveId)
  const name = nameTouched ? draft.name : nextHiveName(siblings.map((h) => h.name))

  const save = async () => {
    // The chosen apiary's names must be loaded: they decide the suggestion and the duplicate check.
    if (saving || namesLoading) return
    const result = hiveSchema(localDay()).safeParse({ ...draft, name })
    if (!result.success) return setErrors(fieldErrors(result.error))
    if (
      nameTaken(
        result.data.name,
        siblings.map((h) => h.name),
      )
    ) {
      return setErrors({ name: 'Ya hay una colmena con ese nombre en este apiario.' })
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
    <View className="flex-1 bg-bg-soft">
      <Screen>
        {header}
        <Text accessibilityRole="header" className="font-display text-title text-text">
          {title}
        </Text>
        <TextField
          label="Nombre *"
          value={name}
          onChangeText={(v) => {
            setNameTouched(true)
            set('name', v)
          }}
          maxLength={40}
          autoCapitalize="characters"
          error={errors.name}
        />
        <ChipSelect
          label="Apiario *"
          options={Object.fromEntries(apiaries.map((a) => [a.id, a.name]))}
          value={single(draft.apiary_id)}
          onChange={(v) => v[0] && set('apiary_id', v[0])}
        />
        {errors.apiary_id ? <FormError message={errors.apiary_id} /> : null}
        <ChipSelect
          label="Tipo"
          options={hiveTypeLabels}
          value={single(draft.hive_type)}
          onChange={(v) => set('hive_type', v[0] ?? null)}
        />
        <StepperField
          label="Cámaras de cría"
          value={draft.brood_boxes}
          onChange={(v) => set('brood_boxes', v)}
          min={0}
          max={5}
        />
        <StepperField
          label="Alzas"
          value={draft.supers}
          onChange={(v) => set('supers', v)}
          min={0}
          max={10}
        />
        <ChipSelect
          label="Origen de la colonia"
          options={colonyOriginLabels}
          value={single(draft.colony_origin)}
          onChange={(v) => set('colony_origin', v[0] ?? null)}
        />
        <ColonyStartField
          value={draft.colony_started_on}
          error={errors.colony_started_on}
          onChange={(v) => set('colony_started_on', v)}
        />
        <TextField
          label="Raza"
          value={draft.bee_race}
          onChangeText={(v) => set('bee_race', v)}
          maxLength={60}
          error={errors.bee_race}
        />
        <View className="flex-row flex-wrap gap-3">
          {races.map((race) => (
            <Button
              key={race}
              variant="secondary"
              label={race}
              onPress={() => set('bee_race', race)}
            />
          ))}
        </View>
        <StepperField
          label="Año de la reina"
          value={draft.queen_year}
          onChange={(year) =>
            setDraft((d) => ({
              ...d,
              queen_year: year,
              queen_color: colorTouched || year === null ? d.queen_color : suggestQueenColor(year),
            }))
          }
          min={2000}
          max={2100}
          start={new Date().getFullYear()}
        />
        <QueenColorField
          value={draft.queen_color}
          year={draft.queen_year}
          onChange={(color) => {
            setColorTouched(true)
            set('queen_color', color)
          }}
        />
        <TriStateField
          label="Reina marcada"
          labels={marked}
          value={draft.queen_marked === null ? 'unknown' : draft.queen_marked ? 'yes' : 'no'}
          onChange={(v) => set('queen_marked', v === 'yes' ? true : v === 'no' ? false : null)}
        />
        <ChipSelect
          label="Origen de la reina"
          options={queenOriginLabels}
          value={single(draft.queen_origin)}
          onChange={(v) => set('queen_origin', v[0] ?? null)}
        />
        {hiveId ? (
          <ChipSelect
            label="Estado"
            options={hiveStatusLabels}
            value={single(draft.status)}
            onChange={(v) => v[0] && set('status', v[0])}
          />
        ) : null}
        <TextField
          label="Notas"
          value={draft.notes}
          onChangeText={(v) => set('notes', v)}
          multiline
          maxLength={2000}
          error={errors.notes}
        />
        {footer}
      </Screen>
      <View
        className="gap-2 border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <FormError
          message={failure ?? (Object.keys(errors).length ? 'Revisa los campos marcados.' : null)}
        />
        <Button icon={Save} label="Guardar" loading={saving} onPress={save} />
      </View>
    </View>
  )
}
