import { router, useLocalSearchParams } from 'expo-router'
import { Lock, StickyNote } from 'lucide-react-native'

import { NotAvailable } from '@/components/ui/NotAvailable'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import type { ServerRow } from '@/db/mapping'
import { saveRow } from '@/db/write'
import { useApiaryNames } from '@/features/apiaries/queries'
import { ReadOnly } from '@/features/auth/ReadOnly'
import { useCanRecord, useRole, useSession } from '@/features/auth/session'
import { EventForm, type EventResult } from '@/features/events/EventForm'
import { useEvent, useRecentProducts } from '@/features/events/queries'
import { isEventType } from '@/features/events/schemas'
import { useHive, useHiveNames } from '@/features/hives/queries'
import { messageFor } from '@/lib/errors'
import { isRecord } from '@/lib/guards'

/** Edit or delete an event: its author or an owner (B4 RLS). Hive effects are not re-applied. */
export default function EditEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const canRecord = useCanRecord()
  const { hive } = useHive(id)
  const { event, loading } = useEvent(eventId)
  const apiaries = useApiaryNames(hive?.organization_id ?? '')
  const apiaryHives = useHiveNames(hive?.apiary_id ?? '').names
  const recentProducts = useRecentProducts(hive?.organization_id ?? '')

  if (!canRecord) return <ReadOnly />
  if (!event || !hive)
    return loading ? null : <NotAvailable icon={StickyNote} title="Este evento ya no existe." />
  const userId = state.status === 'signedIn' ? state.session.user.id : null
  if (!owner && event.created_by !== userId) {
    return (
      <NotAvailable icon={Lock} title="Solo quien lo registró o el propietario puede editarlo." />
    )
  }
  // A label change (M5) and unknown types are history, not forms.
  if (!isEventType(event.type)) return <NotAvailable icon={Lock} title="Este evento no se edita." />

  const write = async (patch: Partial<ServerRow<'hive_events'>>) =>
    saveRow(await getDb(), 'hive_events', {
      ...event,
      ...patch,
      updated_at: new Date().toISOString(),
    })

  const save = async ({ details, occurredAt }: EventResult) => {
    await write({
      details: details as ServerRow<'hive_events'>['details'],
      occurred_at: occurredAt,
    })
    showToast('Guardado en este dispositivo')
    router.back()
  }

  return (
    <EventForm
      type={event.type}
      initial={{
        details: isRecord(event.details) ? event.details : {},
        occurredAt: event.occurred_at,
      }}
      owner={owner}
      editing
      hive={hive}
      apiaries={apiaries}
      apiaryHives={apiaryHives}
      recentProducts={recentProducts}
      newHiveId={null}
      onCreateHive={() => {}}
      onSave={save}
      onDelete={async () => {
        // Said only once the phone has it ("Guardado en este dispositivo" rule).
        try {
          await write({ deleted_at: new Date().toISOString() })
        } catch (e) {
          showToast(messageFor(e), { tone: 'danger' })
          return
        }
        router.back()
        showToast('Evento eliminado', {
          durationMs: 5000,
          onUndo: () =>
            void write({ deleted_at: null }).catch((e: unknown) =>
              showToast(messageFor(e), { tone: 'danger' }),
            ),
        })
      }}
    />
  )
}
