import { Hexagon, Save, Trash2 } from 'lucide-react-native'
import { type ReactNode, useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ChipSelect } from '@/components/field/ChipSelect'
import { StepperField } from '@/components/field/StepperField'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { localDay } from '@/lib/dates'
import { messageFor } from '@/lib/errors'
import { formatCalendarDate } from '@/lib/format'
import {
  eventTypeLabels,
  feedLabels,
  harvestProductLabels,
  label,
  lossCauseLabels,
  queenChangeReasonLabels,
  queenColorLabels,
  queenOriginLabels,
  treatmentMethodLabels,
} from '@/lib/labels'
import { pickDay } from '@/lib/pick-day'
import { suggestQueenColor } from '@/lib/queen-color'
import type { EffectChoices } from './effects'
import { checkDetails, type EventType } from './schemas'
import { withHiveEffect } from './types'

type Details = Record<string, unknown>
type Option = { id: string; name: string }

export type EventResult = { details: Details; occurredAt: string; choices: EffectChoices }

type Props = {
  type: EventType
  initial: { details: Details; occurredAt: string }
  owner: boolean
  /** Editing never re-applies hive effects; the form says so. */
  editing: boolean
  hive: { id: string; name: string; apiary_id: string }
  apiaries: readonly Option[]
  apiaryHives: readonly Option[]
  recentProducts: readonly string[]
  /** The hive just created for a split or swarm (handed back by the hive form). */
  newHiveId: string | null
  onCreateHive: (origin: 'split' | 'swarm_capture') => void
  onSave: (result: EventResult) => Promise<void>
  onDelete?: () => void
}

const single = (value: unknown) => (typeof value === 'string' && value ? [value] : [])
const num = (value: unknown) => (typeof value === 'number' ? value : null)
const str = (value: unknown) => (typeof value === 'string' ? value : '')
const yesNo = { yes: 'Sí', no: 'No' } as const
const lossStatuses = {
  dead: 'Muerta',
  absconded: 'Fugada',
  inactive: 'Inactiva',
  keep: 'Dejar como está',
} as const
const ownerNotice = 'Avisa al propietario para que actualice la colmena.'

function Notice({ text }: { text: string }) {
  return (
    <View className="rounded-card border-2 border-accent p-3">
      <Text className="font-sans text-body text-text">{text}</Text>
    </View>
  )
}

/** One form per type, taps first (spec M10 → Event types and forms); keyboard only for texts. */
export function EventForm(props: Props) {
  const { type, owner, editing, hive, newHiveId } = props
  const insets = useSafeAreaInsets()
  const [details, setDetails] = useState<Details>(props.initial.details)
  const [occurredAt, setOccurredAt] = useState(props.initial.occurredAt)
  const [choices, setChoices] = useState<EffectChoices>({ markMerged: true })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (key: string, value: unknown) => setDetails((d) => ({ ...d, [key]: value }))

  useEffect(() => {
    if (newHiveId) setDetails((d) => ({ ...d, new_hive_id: newHiveId }))
  }, [newHiveId])

  const today = localDay()
  const day = localDay(new Date(occurredAt))
  const yesterday = localDay(new Date(Date.now() - 86_400_000))
  const when = day === today ? 'today' : day === yesterday ? 'yesterday' : 'other'
  const setDay = (picked: string) => {
    const [y = 0, m = 1, d = 1] = picked.split('-').map(Number)
    setOccurredAt(
      picked === today ? new Date().toISOString() : new Date(y, m - 1, d, 12).toISOString(),
    )
  }

  const save = async () => {
    if (saving) return
    const checked = checkDetails(
      type,
      type === 'transfer' ? { ...details, from_apiary_id: hive.apiary_id } : details,
    )
    if (!checked.ok) return setError(checked.message)
    setError(null)
    setSaving(true)
    try {
      await props.onSave({ details: checked.details, occurredAt, choices })
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setSaving(false)
    }
  }

  const fields: Partial<Record<EventType, ReactNode>> = {
    note: (
      <TextField
        label="Nota"
        value={str(details.text)}
        onChangeText={(v) => set('text', v)}
        multiline
        maxLength={2000}
      />
    ),
    feeding: (
      <>
        <ChipSelect
          label="Alimento"
          options={feedLabels}
          value={single(details.feed)}
          onChange={(v) => set('feed', v[0] ?? null)}
        />
        <StepperField
          label="Cantidad"
          value={num(details.amount)}
          onChange={(v) => set('amount', v)}
          min={0.5}
          max={50}
          step={0.5}
        />
        <ChipSelect
          label="Unidad"
          options={{ l: 'Litros', kg: 'Kilos', g: 'Gramos' }}
          value={single(details.unit)}
          onChange={(v) => set('unit', v[0] ?? null)}
        />
        {details.feed === 'sugar_syrup' ? (
          <ChipSelect
            label="Proporción"
            options={{ '1:1': '1:1', '2:1': '2:1' }}
            value={single(details.ratio)}
            onChange={(v) => set('ratio', v[0] ?? null)}
          />
        ) : null}
      </>
    ),
    treatment: (
      <>
        <TextField
          label="Producto *"
          value={str(details.product)}
          onChangeText={(v) => set('product', v)}
          maxLength={120}
        />
        {props.recentProducts.length ? (
          <View className="flex-row flex-wrap gap-3">
            {props.recentProducts.map((p) => (
              <Button key={p} variant="secondary" label={p} onPress={() => set('product', p)} />
            ))}
          </View>
        ) : null}
        <TextField
          label="Principio activo"
          value={str(details.active_ingredient)}
          onChangeText={(v) => set('active_ingredient', v)}
          maxLength={120}
        />
        <TextField
          label="Dosis"
          value={str(details.dose)}
          onChangeText={(v) => set('dose', v)}
          maxLength={120}
        />
        <ChipSelect
          label="Método"
          options={treatmentMethodLabels}
          value={single(details.method)}
          onChange={(v) => set('method', v[0] ?? null)}
        />
        <StepperField
          label="Días de retiro"
          value={num(details.withdrawal_days)}
          onChange={(v) => set('withdrawal_days', v)}
          min={0}
          max={365}
        />
        <Button
          variant="secondary"
          label={
            details.ends_on
              ? `Hasta el ${formatCalendarDate(str(details.ends_on))}`
              : 'Elegir fecha de fin'
          }
          onPress={() => pickDay(str(details.ends_on) || null, (d) => set('ends_on', d), true)}
        />
      </>
    ),
    queen_change: (
      <>
        <StepperField
          label="Año de la reina"
          value={num(details.queen_year)}
          onChange={(year) =>
            setDetails((d) => ({
              ...d,
              queen_year: year,
              queen_color: d.queen_color ?? (year === null ? null : suggestQueenColor(year)),
            }))
          }
          min={2000}
          max={2100}
          start={new Date().getFullYear()}
        />
        <ChipSelect
          label="Color de marca"
          options={queenColorLabels}
          value={single(details.queen_color)}
          onChange={(v) => set('queen_color', v[0] ?? null)}
        />
        <ChipSelect
          label="Origen"
          options={queenOriginLabels}
          value={single(details.queen_origin)}
          onChange={(v) => set('queen_origin', v[0] ?? null)}
        />
        <ChipSelect
          label="Motivo"
          options={queenChangeReasonLabels}
          value={single(details.reason)}
          onChange={(v) => set('reason', v[0] ?? null)}
        />
      </>
    ),
    harvest: (
      <>
        <ChipSelect
          label="Producto *"
          options={harvestProductLabels}
          value={single(details.product)}
          onChange={(v) => set('product', v[0] ?? null)}
        />
        <StepperField
          label="Kilos *"
          value={num(details.kg)}
          onChange={(v) => set('kg', v)}
          min={0.5}
          max={500}
          step={0.5}
          unit="kg"
        />
        <StepperField
          label="Alzas retiradas"
          value={num(details.supers_taken)}
          onChange={(v) => set('supers_taken', v)}
          min={0}
          max={10}
        />
      </>
    ),
    swarm: (
      <ChipSelect
        label="¿Se capturó? *"
        options={yesNo}
        value={
          details.captured === undefined || details.captured === null
            ? []
            : [details.captured ? 'yes' : 'no']
        }
        onChange={(v) => set('captured', v[0] === undefined ? null : v[0] === 'yes')}
      />
    ),
    merge: (
      <>
        <ChipSelect
          label="Colmena que se unió a esta"
          options={Object.fromEntries(
            props.apiaryHives.filter((h) => h.id !== hive.id).map((h) => [h.id, h.name]),
          )}
          value={single(details.merged_hive_id)}
          onChange={(v) => set('merged_hive_id', v[0] ?? null)}
        />
        {owner && !editing && details.merged_hive_id ? (
          <ChipSelect
            label="Marcar esa colmena como Unida"
            options={yesNo}
            value={[choices.markMerged ? 'yes' : 'no']}
            onChange={(v) => setChoices((c) => ({ ...c, markMerged: v[0] !== 'no' }))}
          />
        ) : null}
      </>
    ),
    transfer: (
      <ChipSelect
        label="Apiario de destino *"
        options={Object.fromEntries(
          props.apiaries.filter((a) => a.id !== hive.apiary_id).map((a) => [a.id, a.name]),
        )}
        value={single(details.to_apiary_id)}
        onChange={(v) => set('to_apiary_id', v[0] ?? null)}
      />
    ),
    loss: (
      <>
        <ChipSelect
          label="Causa"
          options={lossCauseLabels}
          value={single(details.cause)}
          onChange={(v) => set('cause', v[0] ?? null)}
        />
        {owner && !editing ? (
          <ChipSelect
            label="Estado de la colmena"
            options={lossStatuses}
            value={[choices.lossStatus ?? 'keep']}
            onChange={(v) =>
              setChoices((c) => ({
                ...c,
                lossStatus:
                  v[0] === 'dead' || v[0] === 'absconded' || v[0] === 'inactive' ? v[0] : null,
              }))
            }
          />
        ) : null}
      </>
    ),
  }

  const createsHive =
    (type === 'split' || (type === 'swarm' && details.captured === true)) && !editing

  return (
    <View className="flex-1 bg-bg-soft">
      <Screen>
        <Text accessibilityRole="header" className="font-display text-title text-text">
          {`${label(eventTypeLabels, type)} · ${hive.name}`}
        </Text>
        <ChipSelect
          label="Cuándo"
          options={{
            today: 'Hoy',
            yesterday: 'Ayer',
            other: when === 'other' ? formatCalendarDate(day) : 'Otra fecha',
          }}
          value={[when]}
          onChange={(v) => {
            if (v[0] === 'today') setDay(today)
            else if (v[0] === 'yesterday') setDay(yesterday)
            else pickDay(day, setDay)
          }}
        />
        {fields[type]}
        {createsHive && owner ? (
          details.new_hive_id ? (
            <Notice text="La colmena nueva quedó registrada y enlazada a este evento." />
          ) : (
            <Button
              variant="accent"
              icon={Hexagon}
              label="Crear la nueva colmena ahora"
              onPress={() => props.onCreateHive(type === 'split' ? 'split' : 'swarm_capture')}
            />
          )
        ) : null}
        {createsHive && !owner ? (
          <Notice text="El propietario debe registrar la nueva colmena." />
        ) : null}
        {withHiveEffect.has(type) && !owner && !createsHive ? <Notice text={ownerNotice} /> : null}
        {editing && withHiveEffect.has(type) ? (
          <Notice text="Editar o eliminar este evento no cambia la colmena; si hace falta, edita la colmena." />
        ) : null}
        {props.onDelete ? (
          <Button variant="danger" icon={Trash2} label="Eliminar evento" onPress={props.onDelete} />
        ) : null}
      </Screen>
      <View
        className="gap-2 border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <FormError message={error} />
        <Button
          icon={Save}
          label="Guardar"
          className="min-h-field"
          loading={saving}
          onPress={() => void save()}
        />
      </View>
    </View>
  )
}
