import { Text, View } from 'react-native'

import { Card } from '@/components/ui/Card'
import { Fact } from '@/components/ui/Fact'
import { formatCalendarDate, formatColonyAge } from '@/lib/format'
import {
  colonyOriginLabels,
  hiveStatusLabels,
  hiveTypeLabels,
  label,
  queenColorLabels,
  queenOriginLabels,
} from '@/lib/labels'
import { QueenDot } from './QueenDot'
import type { HiveDetail } from './queries'

const optional = (labels: Readonly<Record<string, string>>, value: string | null) =>
  value === null ? null : label(labels, value)

const boxes = (hive: HiveDetail) => {
  const parts = [
    hive.brood_boxes === null ? null : `${hive.brood_boxes} de cría`,
    hive.supers === null ? null : `${hive.supers} ${hive.supers === 1 ? 'alza' : 'alzas'}`,
  ]
  return parts.filter(Boolean).join(' · ') || null
}

const markedLabel = (marked: boolean | null) =>
  marked === null ? null : marked ? 'Marcada' : 'Sin marcar'

/** The colony's facts (spec M4 → Hive facts); empty facts are left out. */
export function HiveFacts({ hive }: { hive: HiveDetail }) {
  const queen = [hive.queen_year ? String(hive.queen_year) : null, markedLabel(hive.queen_marked)]
    .filter(Boolean)
    .join(' · ')
  return (
    <Card className="gap-3">
      <Fact label="Apiario" value={hive.apiary_name} />
      <Fact label="Estado" value={label(hiveStatusLabels, hive.status)} />
      <Fact label="Tipo" value={optional(hiveTypeLabels, hive.hive_type)} />
      <Fact label="Cámaras y alzas" value={boxes(hive)} />
      <Fact label="Origen de la colonia" value={optional(colonyOriginLabels, hive.colony_origin)} />
      <Fact
        label="Edad"
        value={
          hive.colony_started_on
            ? `${formatColonyAge(hive.colony_started_on)} (desde el ${formatCalendarDate(hive.colony_started_on)})`
            : null
        }
      />
      <Fact label="Raza" value={hive.bee_race} />
      {hive.queen_color || queen ? (
        <View className="gap-0.5">
          <Text className="font-sans text-caption text-muted">Reina</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            {hive.queen_color ? <QueenDot color={hive.queen_color} /> : null}
            <Text className="font-sans text-body text-text">
              {[optional(queenColorLabels, hive.queen_color), queen].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
      ) : null}
      <Fact label="Origen de la reina" value={optional(queenOriginLabels, hive.queen_origin)} />
      <Fact label="Notas" value={hive.notes} />
      <Fact label="Código QR" value={hive.qr_code} />
    </Card>
  )
}
