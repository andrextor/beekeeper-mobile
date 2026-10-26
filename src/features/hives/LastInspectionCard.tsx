import { Text, View } from 'react-native'

import { Card } from '@/components/ui/Card'
import { Fact } from '@/components/ui/Fact'
import { formatLastInspection } from '@/lib/format'
import { label, observedLabels, storesLabels } from '@/lib/labels'
import type { LatestInspection } from './queries'

/** "Última revisión hace 12 días · por Ana" and the four facts that matter at the hive. */
export function LastInspectionCard({ latest }: { latest: LatestInspection | null }) {
  if (!latest) {
    return (
      <Card>
        <Text className="font-sans text-body text-muted">Sin revisiones todavía.</Text>
      </Card>
    )
  }
  const { inspection, author } = latest
  return (
    <Card className="gap-3">
      <Text className="font-sans-semibold text-body text-text">
        {`${formatLastInspection(inspection.inspected_at)} · por ${author ?? 'Antiguo miembro'}`}
      </Text>
      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Fact
          label="Fuerza"
          value={
            inspection.population_strength === null
              ? null
              : `${inspection.population_strength} de 5`
          }
        />
        <Fact
          label="Reina vista"
          value={
            inspection.queen_seen === null ? null : label(observedLabels, inspection.queen_seen)
          }
        />
        <Fact
          label="Cuadros de cría"
          value={inspection.brood_frames === null ? null : String(inspection.brood_frames)}
        />
        <Fact
          label="Reservas"
          value={inspection.stores === null ? null : label(storesLabels, inspection.stores)}
        />
      </View>
    </Card>
  )
}
