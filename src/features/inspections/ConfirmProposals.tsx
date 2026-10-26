import { Check, Mic, Pencil, TriangleAlert, X } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import type { Proposal } from '@/features/voice/parser'
import { cx } from '@/lib/cx'
import { eventSummary } from '@/lib/event-summary'
import { formatCalendarDate } from '@/lib/format'
import { withTap } from '@/lib/haptics'
import {
  attentionLevelLabels,
  broodPatternLabels,
  diseaseSignLabels,
  label,
  observedLabels,
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
import { fieldPlaces, type SectionKey } from './FieldSections'
import type { InspectionDraft } from './schema'

const valueLabels: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  queen_seen: observedLabels,
  eggs_seen: observedLabels,
  larvae_seen: observedLabels,
  queen_cells: queenCellsLabels,
  brood_pattern: broodPatternLabels,
  stores: storesLabels,
  varroa_method: varroaMethodLabels,
  weather: weatherLabels,
  attention_level: attentionLevelLabels,
  pests: pestLabels,
  disease_signs: diseaseSignLabels,
  planned_actions: plannedActionLabels,
  population_strength: populationStrengthLabels,
  temperament: temperamentLabels,
}

function shown(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (field === 'next_inspection_on' && typeof value === 'string') return formatCalendarDate(value)
  if (field === 'temperature_c') return `${String(value)} °C`
  const labels = valueLabels[field]
  return labels ? label(labels, String(value)) : String(value)
}

function line(p: Proposal, hiveName: string): string {
  if (p.field === 'feeding_event') return eventSummary('feeding', p.value)
  if (p.field === 'hive_mismatch') {
    return `Mencionaste la colmena ${p.value.toUpperCase()} pero estás en ${hiveName}`
  }
  return `${fieldPlaces[p.field]?.label ?? p.field}: ${shown(p.field, p.value)}`
}

type Choice = 'accept' | 'change' | 'remove'

type Props = {
  transcript: string
  proposals: Proposal[]
  current: InspectionDraft
  hiveName: string
  /** Accepted proposals; `change` fields are left for the person, opening their section. */
  onDone: (accepted: Proposal[], text: string, change: SectionKey | null) => void
  onRedictate: () => void
  onCancel: () => void
}

/** Spec M8 → Confirmation: nothing from the dictation reaches the draft unless accepted here. */
export function ConfirmProposals({
  transcript,
  proposals,
  current,
  hiveName,
  onDone,
  onRedictate,
  onCancel,
}: Props) {
  const [choices, setChoices] = useState<Choice[]>(() => proposals.map(() => 'accept'))
  const set = (i: number, choice: Choice) =>
    setChoices((c) => c.map((x, j) => (j === i ? choice : x)))

  // The transcript with every matched phrase highlighted.
  const parts: { text: string; hit: boolean }[] = []
  let at = 0
  for (const p of [...proposals].sort((a, b) => a.span[0] - b.span[0])) {
    if (p.span[0] < at) continue
    parts.push(
      { text: transcript.slice(at, p.span[0]), hit: false },
      { text: transcript.slice(p.span[0], p.span[1]), hit: true },
    )
    at = p.span[1]
  }
  parts.push({ text: transcript.slice(at), hit: false })

  const finish = () => {
    const accepted = proposals.filter((_, i) => choices[i] === 'accept')
    const changed = proposals.find((p, i) => choices[i] === 'change' && p.field in fieldPlaces)
    onDone(accepted, transcript, changed ? (fieldPlaces[changed.field]?.section ?? null) : null)
  }

  return (
    <ScrollView contentContainerClassName="gap-4 p-4 pb-16">
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Lo que entendimos
      </Text>
      <Text className="rounded-card bg-bg-soft p-4 font-sans text-field-label">
        {parts.map((part, i) =>
          part.hit ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: parts of one fixed text
            <Text key={i} className="bg-accent text-text">
              {part.text}
            </Text>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: parts of one fixed text
            <Text key={i} className="text-text">
              {part.text}
            </Text>
          ),
        )}
      </Text>
      {proposals.length === 0 ? (
        <Text className="font-sans text-body text-muted">
          No reconocimos campos en lo que dijiste. El texto queda guardado en la revisión.
        </Text>
      ) : null}
      {proposals.map((p, i) => {
        const before =
          p.field in current && !['pests', 'disease_signs', 'planned_actions'].includes(p.field)
            ? current[p.field as keyof InspectionDraft]
            : null
        const choice = choices[i]
        const warning = p.field === 'hive_mismatch'
        return (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: proposals of one dictation, fixed order
            key={i}
            className={cx(
              'gap-3 rounded-card border-2 p-4',
              choice === 'remove'
                ? 'border-border opacity-60'
                : warning
                  ? 'border-danger'
                  : 'border-accent',
            )}
          >
            <View className="flex-row items-center gap-2">
              {warning ? <TriangleAlert color={color.danger} size={iconSize.standard} /> : null}
              <Text className="flex-1 font-sans-semibold text-field-label text-text">
                {line(p, hiveName)}
              </Text>
            </View>
            {before !== null && before !== undefined && before !== p.value ? (
              <Text className="font-sans text-body text-muted">{`Antes: ${shown(p.field, before)}`}</Text>
            ) : null}
            {p.confidence === 'medium' && !warning ? (
              <Text className="font-sans-semibold text-body text-text">
                Revisar: puede no ser exacto
              </Text>
            ) : null}
            {warning ? null : (
              <View className="flex-row gap-2">
                {(
                  [
                    ['accept', 'Aceptar', Check],
                    ['change', 'Cambiar', Pencil],
                    ['remove', 'Quitar', X],
                  ] as const
                ).map(([value, text, Icon]) => (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: choice === value }}
                    onPress={withTap(() => set(i, value))}
                    className={cx(
                      'min-h-field flex-1 items-center justify-center gap-1 rounded-button border-2 active:opacity-80',
                      choice === value ? 'border-deep bg-accent' : 'border-border bg-surface',
                    )}
                  >
                    <Icon color={color.text} size={iconSize.standard} />
                    <Text className="font-sans-semibold text-body text-text">{text}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )
      })}
      <Button icon={Check} label="Aceptar todo" className="min-h-tile" onPress={finish} />
      <Button variant="secondary" icon={Mic} label="Volver a dictar" onPress={onRedictate} />
      <Button variant="secondary" label="Cancelar" onPress={onCancel} />
    </ScrollView>
  )
}
