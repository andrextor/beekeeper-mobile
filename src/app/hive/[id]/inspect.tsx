import { router, useLocalSearchParams } from 'expo-router'
import { ClipboardCheck, Hexagon, Lock } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'

import { NotAvailable } from '@/components/ui/NotAvailable'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { useRole, useSession } from '@/features/auth/session'
import { useHive, useLatestInspection } from '@/features/hives/queries'
import { localDay } from '@/features/hives/schema'
import { type Draft, openDraft, openEditDraft } from '@/features/inspections/drafts'
import { FieldInspection } from '@/features/inspections/FieldInspection'
import { type Finished, undoFinish } from '@/features/inspections/finish'
import { exclusive } from '@/features/sync/triggers'
import { messageFor } from '@/lib/errors'
import { formatLastInspection, formatTime } from '@/lib/format'
import { uuid } from '@/lib/ids'

type Opened =
  | { kind: 'ready'; draft: Draft }
  | { kind: 'missing' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; message: string }
  | null

/** Field mode: opens (or resumes) the hive's draft, or an edit draft with `inspectionId`. */
export default function InspectScreen() {
  const { id, inspectionId } = useLocalSearchParams<{ id: string; inspectionId?: string }>()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const userId = state.status === 'signedIn' ? state.session.user.id : ''
  const { hive, loading } = useHive(id)
  const { latest } = useLatestInspection(id)
  // One open per screen: a re-render (role or session settling) must not open or toast twice.
  const started = useRef(false)
  const [opened, setOpened] = useState<Opened>(null)
  const organizationId = hive?.organization_id

  useEffect(() => {
    if (!organizationId || !userId || started.current) return
    started.current = true
    void (async () => {
      const db = await getDb()
      const now = new Date().toISOString()
      if (inspectionId) {
        // B4: the author or an owner edits an inspection; the server refuses anyone else.
        const saved = await db.getFirstAsync<{ created_by: string }>(
          'select created_by from inspections where id = ?',
          [inspectionId],
        )
        if (saved && !owner && saved.created_by !== userId) return setOpened({ kind: 'forbidden' })
      }
      const result = inspectionId
        ? await openEditDraft(db, inspectionId, now)
        : await openDraft(db, { id: uuid(), hiveId: id, organizationId, now })
      if (!result) return setOpened({ kind: 'missing' })
      setOpened({ kind: 'ready', draft: result.draft })
      if (result.resumed) {
        showToast(`Continuando la revisión de las ${formatTime(result.draft.created_at)}`)
      }
    })().catch((e: unknown) => setOpened({ kind: 'failed', message: messageFor(e) }))
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
  if (opened?.kind === 'failed')
    return <NotAvailable icon={ClipboardCheck} title={opened.message} />
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
      lastInspection={formatLastInspection(latest?.inspection.inspected_at ?? null)}
      userId={userId}
      today={localDay()}
      onBack={() => router.back()}
      onFinished={finished}
      onActivity={() =>
        router.push({ pathname: '/hive/[id]/event/new', params: { id, draftId: opened.draft.id } })
      }
      onPhoto={() =>
        router.push({
          pathname: '/hive/[id]/camera',
          params: { id, inspectionId: opened.draft.id },
        })
      }
    />
  )
}
