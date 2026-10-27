import { ClipboardPen } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { useLocalQuery } from '@/db/useLocalQuery'
import { removeLocal } from '@/features/sync/discard'
import { exclusive } from '@/features/sync/triggers'
import { messageFor } from '@/lib/errors'
import { formatTime } from '@/lib/format'
import { color, iconSize } from '@/lib/theme'
import { discardDraft, getDraft, restoreDraft } from './drafts'

export type DraftSummary = {
  id: string
  hive_id: string
  hive_name: string | null
  created_at: string
  is_edit: number
}

const draftsSql = (
  where: string,
) => `select d.id, d.hive_id, h.name as hive_name, d.created_at, d.is_edit
  from inspection_drafts d left join hives h on h.id = d.hive_id ${where}
  order by d.created_at limit 50`

/** Unfinished inspections of one hive, or of the active finca; never dropped silently (spec M7). */
export function useDrafts(scope: { hiveId: string } | { organizationId: string }): DraftSummary[] {
  const byHive = 'hiveId' in scope
  return useLocalQuery<DraftSummary>(
    draftsSql(byHive ? 'where d.hive_id = ?' : 'where d.organization_id = ?'),
    [byHive ? scope.hiveId : scope.organizationId],
    ['inspection_drafts', 'hives'],
  ).rows
}

/** A discarded draft's photos (never sent: their inspection never existed) go with their files. */
async function dropDraftPhotos(inspectionId: string): Promise<void> {
  const db = await getDb()
  await exclusive(() =>
    db.transaction(async () => {
      const photos = await db.getAllAsync<{ id: string }>(
        'select id from photos where inspection_id = ? and _on_server = 0',
        [inspectionId],
      )
      for (const p of photos) await removeLocal(db, 'photos', p.id)
    }),
  )
}

/** "Descartar" with Deshacer: the draft comes back exactly as it was. */
export async function discardWithUndo(id: string): Promise<void> {
  const db = await getDb()
  const draft = await getDraft(db, id)
  if (!draft) return
  await discardDraft(db, id)
  showToast('Revisión descartada', {
    // An edit's photos belong to an inspection that exists: they stay (and upload).
    onExpire: draft.is_edit ? undefined : () => void dropDraftPhotos(id),
    onUndo: () =>
      void restoreDraft(db, draft).catch((e: unknown) =>
        showToast(`No se pudo deshacer: ${messageFor(e)}`, { tone: 'danger' }),
      ),
  })
}

type Props = { draft: DraftSummary; showHive?: boolean; onContinue: () => void }

export function DraftCard({ draft, showHive = false, onContinue }: Props) {
  const what = draft.is_edit ? 'Edición sin terminar' : 'Revisión sin terminar'
  const where = showHive && draft.hive_name ? ` de ${draft.hive_name}` : ''
  return (
    <View className="gap-3 rounded-card bg-accent-soft p-4">
      <View className="flex-row items-center gap-3">
        <ClipboardPen color={color.text} size={iconSize.field} />
        <Text className="flex-1 font-sans-semibold text-body text-text">
          {`${what}${where} · empezada a las ${formatTime(draft.created_at)}`}
        </Text>
      </View>
      <Button variant="accent" label="Continuar" className="min-h-field" onPress={onContinue} />
      <Button
        variant="secondary"
        label="Descartar"
        onPress={() => void discardWithUndo(draft.id)}
      />
    </View>
  )
}
