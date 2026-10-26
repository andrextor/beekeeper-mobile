import { Text, View } from 'react-native'

import { Card } from '@/components/ui/Card'
import { Fact } from '@/components/ui/Fact'
import { eventSummary } from '@/lib/event-summary'
import { formatDateTime } from '@/lib/format'
import { inspectionFields } from '@/lib/inspection-summary'
import { inspectionSourceLabels, label } from '@/lib/labels'
import type { InspectionDetail } from './queries'

/** Every recorded field with its label; nulls hidden, "No revisado" kept (it was looked at). */
export function InspectionDetailView({ detail }: { detail: InspectionDetail }) {
  const { inspection } = detail
  const fields = inspectionFields(inspection)
  return (
    <>
      <Text className="font-sans text-body text-muted">
        {`${formatDateTime(inspection.inspected_at)} · ${label(inspectionSourceLabels, inspection.source)} · por ${detail.author ?? 'Antiguo miembro'}`}
      </Text>
      <Card className="gap-3">
        {fields.length ? (
          fields.map((f) => <Fact key={f.label} label={f.label} value={f.value} />)
        ) : (
          <Text className="font-sans text-body text-muted">Sin datos registrados.</Text>
        )}
      </Card>
      {inspection.transcript ? (
        <Card className="gap-2">
          <Text className="font-sans text-caption text-muted">Lo que se dictó</Text>
          <View className="border-l-4 border-accent pl-3">
            <Text className="font-sans text-body text-text">{`“${inspection.transcript}”`}</Text>
          </View>
        </Card>
      ) : null}
      {inspection.notes ? (
        <Card className="gap-2">
          <Text className="font-sans text-caption text-muted">Notas</Text>
          <Text className="font-sans text-body text-text">{inspection.notes}</Text>
        </Card>
      ) : null}
      {detail.events.length ? (
        <Card className="gap-2">
          <Text className="font-sans text-caption text-muted">Registrado en esta revisión</Text>
          {detail.events.map((e) => (
            <Text key={e.id} className="font-sans text-body text-text">
              {eventSummary(e.type, e.details)}
            </Text>
          ))}
        </Card>
      ) : null}
    </>
  )
}
