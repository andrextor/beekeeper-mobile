import { ChevronDown, ChevronUp, Pencil } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { ChipSelect } from '@/components/field/ChipSelect'
import { ScaleField, type ScaleValue } from '@/components/field/ScaleField'
import { StepperField } from '@/components/field/StepperField'
import { type Observed, TriStateField } from '@/components/field/TriStateField'
import { Button } from '@/components/ui/Button'
import { addDays, daysBetween } from '@/lib/dates'
import { formatCalendarDate, formatNumber } from '@/lib/format'
import { withTap } from '@/lib/haptics'
import {
  attentionLevelLabels,
  broodPatternLabels,
  diseaseSignLabels,
  pestLabels,
  plannedActionLabels,
  populationStrengthLabels,
  queenCellsLabels,
  storesLabels,
  temperamentLabels,
  varroaMethodLabels,
  weatherLabels,
} from '@/lib/labels'
import { color, iconSize } from '@/lib/theme'
import type { InspectionDraft } from './schema'
import { varroaLoadPercent } from './varroa'

export type SectionKey = 'colony' | 'brood' | 'health' | 'work'

export const sectionTitles: Record<SectionKey, string> = {
  colony: 'Colonia',
  brood: 'Cría y reservas',
  health: 'Sanidad',
  work: 'Trabajo',
}

/** Where each field lives and its name, for Terminar's problem list ("Ir al campo"). */
export const fieldPlaces: Record<string, { section: SectionKey; label: string }> = {
  inspected_at: { section: 'colony', label: 'Fecha de la revisión' },
  population_strength: { section: 'colony', label: 'Fuerza de la colonia' },
  temperament: { section: 'colony', label: 'Temperamento' },
  queen_seen: { section: 'colony', label: 'Reina vista' },
  eggs_seen: { section: 'colony', label: 'Huevos' },
  larvae_seen: { section: 'colony', label: 'Larvas' },
  queen_cells: { section: 'colony', label: 'Celdas reales' },
  brood_frames: { section: 'brood', label: 'Cuadros de cría' },
  brood_pattern: { section: 'brood', label: 'Patrón de cría' },
  honey_frames: { section: 'brood', label: 'Cuadros de miel' },
  pollen_frames: { section: 'brood', label: 'Cuadros de polen' },
  stores: { section: 'brood', label: 'Reservas' },
  varroa_method: { section: 'health', label: 'Método de varroa' },
  varroa_sample_size: { section: 'health', label: 'Abejas en la muestra' },
  varroa_count: { section: 'health', label: 'Varroas contadas' },
  pests: { section: 'health', label: 'Plagas' },
  disease_signs: { section: 'health', label: 'Signos de enfermedad' },
  attention_level: { section: 'work', label: 'Atención' },
  planned_actions: { section: 'work', label: 'Acciones planeadas' },
  next_inspection_on: { section: 'work', label: 'Próxima revisión' },
  weather: { section: 'work', label: 'Clima' },
  temperature_c: { section: 'work', label: 'Temperatura' },
  notes: { section: 'work', label: 'Notas de la revisión' },
}

const nextChoices = {
  '7': 'En 7 días',
  '14': 'En 14 días',
  '21': 'En 21 días',
  other: 'Otra',
} as const
const withSample = new Set(['alcohol_wash', 'sugar_roll'])

type Props = {
  fields: InspectionDraft
  onChange: (patch: Partial<InspectionDraft>) => void
  today: string
  open: Record<SectionKey, boolean>
  onToggle: (section: SectionKey) => void
  onLayoutSection: (section: SectionKey, y: number) => void
  onWriteNotes: () => void
}

const single = (value: string | null) => (value ? [value] : [])

function Section({
  id,
  open,
  onToggle,
  onLayout,
  caption,
  children,
}: {
  id: SectionKey
  open: boolean
  onToggle: () => void
  onLayout: (y: number) => void
  caption?: string
  children: ReactNode
}) {
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <View onLayout={(e) => onLayout(e.nativeEvent.layout.y)} className="gap-6">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={withTap(onToggle)}
        className="min-h-target flex-row items-center justify-between border-b-2 border-border active:opacity-70"
      >
        <Text className="font-display text-title text-text">{sectionTitles[id]}</Text>
        <Chevron color={color.text} size={iconSize.field} />
      </Pressable>
      {open && caption ? <Text className="font-sans text-body text-muted">{caption}</Text> : null}
      {open ? children : null}
    </View>
  )
}

/** Spec M7 → Layout 3: every field by taps, unset until chosen, the chosen chip clears on a tap. */
export function FieldSections({
  fields: f,
  onChange,
  today,
  open,
  onToggle,
  onLayoutSection,
  onWriteNotes,
}: Props) {
  const section = (id: SectionKey) => ({
    id,
    open: open[id],
    onToggle: () => onToggle(id),
    onLayout: (y: number) => onLayoutSection(id, y),
  })
  const load = varroaLoadPercent(f.varroa_count, f.varroa_sample_size)
  const daysAhead = f.next_inspection_on ? daysBetween(today, f.next_inspection_on) : null
  const nextChoice =
    daysAhead === null
      ? null
      : ['7', '14', '21'].includes(String(daysAhead))
        ? String(daysAhead)
        : 'other'

  return (
    <>
      <Section {...section('colony')}>
        <ScaleField
          label="Fuerza de la colonia"
          value={f.population_strength as ScaleValue | null}
          onChange={(v) => onChange({ population_strength: v })}
          words={populationStrengthLabels}
        />
        <ScaleField
          label="Temperamento"
          value={f.temperament as ScaleValue | null}
          onChange={(v) => onChange({ temperament: v })}
          words={temperamentLabels}
        />
        <TriStateField
          label="Reina vista"
          value={f.queen_seen as Observed | null}
          onChange={(v) => onChange({ queen_seen: v })}
        />
        <TriStateField
          label="Huevos"
          value={f.eggs_seen as Observed | null}
          onChange={(v) => onChange({ eggs_seen: v })}
        />
        <TriStateField
          label="Larvas"
          value={f.larvae_seen as Observed | null}
          onChange={(v) => onChange({ larvae_seen: v })}
        />
        <ChipSelect
          label="Celdas reales"
          options={queenCellsLabels}
          value={single(f.queen_cells)}
          onChange={(v) => onChange({ queen_cells: v[0] ?? null })}
        />
      </Section>

      <Section {...section('brood')}>
        <StepperField
          label="Cuadros de cría"
          value={f.brood_frames}
          onChange={(v) => onChange({ brood_frames: v })}
          min={0}
          max={40}
        />
        <ChipSelect
          label="Patrón de cría"
          options={broodPatternLabels}
          value={single(f.brood_pattern)}
          onChange={(v) => onChange({ brood_pattern: v[0] ?? null })}
        />
        <StepperField
          label="Cuadros de miel"
          value={f.honey_frames}
          onChange={(v) => onChange({ honey_frames: v })}
          min={0}
          max={40}
        />
        <StepperField
          label="Cuadros de polen"
          value={f.pollen_frames}
          onChange={(v) => onChange({ pollen_frames: v })}
          min={0}
          max={40}
        />
        <ChipSelect
          label="Reservas"
          options={storesLabels}
          value={single(f.stores)}
          onChange={(v) => onChange({ stores: v[0] ?? null })}
        />
      </Section>

      <Section {...section('health')} caption="Signos observados, no es un diagnóstico.">
        <ChipSelect
          label="Varroa: método"
          options={varroaMethodLabels}
          value={single(f.varroa_method)}
          onChange={(v) => {
            const method = v[0] ?? null
            const sample = method && withSample.has(method) ? (f.varroa_sample_size ?? 300) : null
            onChange({ varroa_method: method, varroa_sample_size: sample })
          }}
        />
        {f.varroa_method && withSample.has(f.varroa_method) ? (
          <StepperField
            label="Abejas en la muestra"
            value={f.varroa_sample_size}
            onChange={(v) => onChange({ varroa_sample_size: v })}
            min={50}
            max={1000}
            step={50}
            start={300}
          />
        ) : null}
        <StepperField
          label="Varroas contadas"
          value={f.varroa_count}
          onChange={(v) => onChange({ varroa_count: v })}
          min={0}
          max={999}
        />
        {load !== null ? (
          <Text className="font-sans-semibold text-field-label text-text">
            {`Carga: ${formatNumber(load)} %`}
          </Text>
        ) : null}
        <ChipSelect
          label="Plagas"
          options={pestLabels}
          value={f.pests ?? []}
          onChange={(v) => onChange({ pests: v.length ? v : null })}
          multiple
        />
        <ChipSelect
          label="Signos de enfermedad"
          options={diseaseSignLabels}
          value={f.disease_signs ?? []}
          onChange={(v) => onChange({ disease_signs: v.length ? v : null })}
          multiple
        />
      </Section>

      <Section {...section('work')}>
        <ChipSelect
          label="Atención"
          options={attentionLevelLabels}
          value={single(f.attention_level)}
          onChange={(v) => onChange({ attention_level: v[0] ?? null })}
        />
        <ChipSelect
          label="Acciones planeadas"
          options={plannedActionLabels}
          value={f.planned_actions ?? []}
          onChange={(v) => onChange({ planned_actions: v.length ? v : null })}
          multiple
        />
        <ChipSelect
          label="Próxima revisión"
          options={nextChoices}
          value={single(nextChoice)}
          onChange={(v) => {
            const choice = v[0]
            if (!choice) return onChange({ next_inspection_on: null })
            const days = choice === 'other' ? 30 : Number(choice)
            onChange({ next_inspection_on: addDays(today, days) })
          }}
        />
        {nextChoice === 'other' && daysAhead !== null ? (
          <StepperField
            label="En cuántos días"
            value={daysAhead}
            onChange={(v) =>
              onChange({ next_inspection_on: v === null ? null : addDays(today, v) })
            }
            min={1}
            max={90}
          />
        ) : null}
        {f.next_inspection_on ? (
          <Text className="font-sans-semibold text-body text-text">
            {formatCalendarDate(f.next_inspection_on)}
          </Text>
        ) : null}
        <ChipSelect
          label="Clima"
          options={weatherLabels}
          value={single(f.weather)}
          onChange={(v) => onChange({ weather: v[0] ?? null })}
        />
        <StepperField
          label="Temperatura"
          value={f.temperature_c}
          onChange={(v) => onChange({ temperature_c: v })}
          min={-20}
          max={60}
          start={20}
          unit="°C"
        />
        <Button
          variant="secondary"
          icon={Pencil}
          label={f.notes ? 'Editar notas de la revisión' : 'Escribir notas de la revisión'}
          onPress={onWriteNotes}
        />
        {f.notes ? <Text className="font-sans text-body text-text">{f.notes}</Text> : null}
      </Section>
    </>
  )
}
