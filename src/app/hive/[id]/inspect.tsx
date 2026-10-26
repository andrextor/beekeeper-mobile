import { router, useLocalSearchParams } from 'expo-router'
import { ClipboardCheck, Hexagon, Lock } from 'lucide-react-native'
import { useEffect, useState } from 'react'

import { NotAvailable } from '@/components/ui/NotAvailable'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { useLocalQuery } from '@/db/useLocalQuery'
import { useRole, useSession } from '@/features/auth/session'
import { useHive } from '@/features/hives/queries'
import { localDay } from '@/features/hives/schema'
import { type Draft, openDraft, openEditDraft } from '@/features/inspections/drafts'
import { FieldInspection } from '@/features/inspections/FieldInspection'
import { type Finished, undoFinish } from '@/features/inspections/finish'
import { exclusive } from '@/features/sync/triggers'
import { messageFor } from '@/lib/errors'
import { formatLastInspection, formatTime } from '@/lib/format'
import { uuid } from '@/lib/ids'

type Opened = { kind: 'ready'; draft: Draft } | { kind: 'missing' } | { kind: 'forbidden' } | null

/** Field mode: opens (or resumes) the hive's draft, or an edit draft with `inspectionId`. */
export default function InspectScreen() {
  const { id, inspectionId } = useLocalSearchParams<{ id: string; inspectionId?: string }>()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const userId = state.status === 'signedIn' ? state.session.user.id : ''
  const { hive, loading } = useHive(id)
  const last = useLocalQuery<{ inspected_at: string }>(
    'select inspected_at from inspections where hive_id = ? and deleted_at is null order by inspected_at desc limit 1',
    [id],
    ['inspections'],
  ).rows[0]
  const [opened, setOpened] = useState<Opened>(null)
  const organizationId = hive?.organization_id

  useEffect(() => {
    if (!organizationId || !userId) return
    let alive = true
    void (async () => {
      const db = await getDb()
      const now = new Date().toISOString()
      if (inspectionId) {
        // B4: the author or an owner edits an inspection; the server refuses anyone else.
        const saved = await db.getFirstAsync<{ created_by: string }>(
          'select created_by from inspections where id = ?',
          [inspectionId],
        )
        if (saved && !owner && saved.created_by !== userId)
          return alive && setOpened({ kind: 'forbidden' })
      }
      const result = inspectionId
        ? await openEditDraft(db, inspectionId, now)
        : await openDraft(db, { id: uuid(), hiveId: id, organizationId, now })
      if (!alive) return
      if (!result) return setOpened({ kind: 'missing' })
      setOpened({ kind: 'ready', draft: result.draft })
      if (result.resumed) {
        showToast(`Continuando la revisión de las ${formatTime(result.draft.created_at)}`)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, inspectionId, organizationId, userId, owner])

  if (!hive)
    return loading ? null : <NotAvailable icon={Hexagon} title="Esta colmena ya no existe." />
  if (opened?.kind === 'forbidden') {
    return (
      <NotAvailable
        icon={Lock}
        title="Solo quien hizo la revisión o el propietario puede editarla."
      />
    )
  }
  if (opened?.kind === 'missing') {
    return <NotAvailable icon={ClipboardCheck} title="Esta revisión ya no está en el teléfono." />
  }
  if (opened?.kind !== 'ready') return null

  const finished = (done: Finished) => {
    router.back()
    showToast('Guardado en este dispositivo', {
      onUndo: () =>
        void (async () => {
          try {
            const db = await getDb()
            await exclusive(() => undoFinish(db, done))
            router.push({
              pathname: '/hive/[id]/inspect',
              params: inspectionId ? { id, inspectionId } : { id },
            })
          } catch (e) {
            showToast(messageFor(e), { tone: 'danger' })
          }
        })(),
    })
  }

  return (
    <FieldInspection
      draft={opened.draft}
      apiaryName={hive.apiary_name ?? ''}
      hiveName={hive.name}
      lastInspection={formatLastInspection(last?.inspected_at ?? null)}
      userId={userId}
      today={localDay()}
      onBack={() => router.back()}
      onFinished={finished}
    />
  )
}
