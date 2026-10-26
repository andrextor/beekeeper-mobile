import { ClipboardPen } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { useLocalQuery } from '@/db/useLocalQuery'
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

/** Unfinished inspections on this phone; never dropped silently (spec M7 → Drafts). */
export function useDrafts(hiveId?: string): DraftSummary[] {
  return useLocalQuery<DraftSummary>(
    draftsSql(hiveId ? 'where d.hive_id = ?' : ''),
    hiveId ? [hiveId] : [],
    ['inspection_drafts', 'hives'],
  ).rows
}

/** "Descartar" with Deshacer: the draft comes back exactly as it was. */
export async function discardWithUndo(id: string): Promise<void> {
  const db = await getDb()
  const draft = await getDraft(db, id)
  if (!draft) return
  await discardDraft(db, id)
  showToast('Revisión descartada', { onUndo: () => void restoreDraft(db, draft) })
}

type Props = { draft: DraftSummary; showHive?: boolean; onContinue: () => void }

export function DraftCard({ draft, showHive = false, onContinue }: Props) {
  const what = draft.is_edit ? 'Edición sin terminar' : 'Revisión sin terminar'
  const where = showHive && draft.hive_name ? ` de ${draft.hive_name}` : ''
  return (
    <View className="gap-3 rounded-card border-2 border-accent bg-surface p-4">
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
