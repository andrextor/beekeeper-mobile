import { CloudCheck } from 'lucide-react-native'
import type { ReactElement } from 'react'
import { SectionList, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'
import { entryDetail, entryTitle, type PendingEntry } from './pending'

type Props = {
  entries: PendingEntry[]
  header: ReactElement
  refreshing: boolean
  onRefresh: () => void
  onDiscard: (entry: PendingEntry) => void
  /** The way to fix an attention entry, when its module has one ("Revisar", "Generar otro código"). */
  fixFor: (entry: PendingEntry) => { label: string; onPress: () => void } | null
}

type CardProps = Pick<Props, 'onDiscard' | 'fixFor'> & { entry: PendingEntry }

function EntryCard({ entry, onDiscard, fixFor }: CardProps) {
  const attention = entry.state === 'failed_permanent'
  const fix = attention ? fixFor(entry) : null
  return (
    <Card className="gap-2">
      <Text className="font-sans-semibold text-body text-text">{entryTitle(entry)}</Text>
      <Text className={cx('font-sans text-caption', attention ? 'text-danger' : 'text-muted')}>
        {attention ? (entry.last_error ?? 'No se pudo guardar.') : entryDetail(entry)}
      </Text>
      {fix ? <Button label={fix.label} onPress={fix.onPress} /> : null}
      {attention ? (
        <Button variant="secondary" label="Descartar cambio" onPress={() => onDiscard(entry)} />
      ) : null}
    </Card>
  )
}

/** Pull to refresh runs a full sync. */
export function PendingList({ entries, header, refreshing, onRefresh, onDiscard, fixFor }: Props) {
  const attention = entries.filter((e) => e.state === 'failed_permanent')
  const queued = entries.filter((e) => e.state !== 'failed_permanent')
  const sections = [
    { title: 'Requiere atención', data: attention },
    { title: 'Pendientes', data: queued },
  ].filter((s) => s.data.length > 0)

  return (
    <SectionList
      sections={sections}
      keyExtractor={(entry) => entry.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          icon={CloudCheck}
          title="Sin pendientes"
          body="Lo que guardes sin señal espera aquí hasta sincronizarse."
        />
      }
      renderSectionHeader={({ section }) => (
        <Text
          accessibilityRole="header"
          className="bg-bg-soft pt-4 pb-2 font-display text-section text-text"
        >
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => <EntryCard entry={item} onDiscard={onDiscard} fixFor={fixFor} />}
      ItemSeparatorComponent={() => <View className="h-3" />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      style={{ backgroundColor: color.bgSoft }}
    />
  )
}
