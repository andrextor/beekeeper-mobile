import { router, useLocalSearchParams } from 'expo-router'
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Hexagon,
  Pencil,
  QrCode,
} from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BackButton } from '@/components/ui/BackButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { SyncChip } from '@/components/ui/SyncChip'
import { useRole } from '@/features/auth/session'
import { AttentionCard } from '@/features/hives/AttentionCard'
import { hiveAttention } from '@/features/hives/attention'
import { HiveFacts } from '@/features/hives/HiveFacts'
import { LastInspectionCard } from '@/features/hives/LastInspectionCard'
import { useHive, useHiveAttentionData, useHiveQueue } from '@/features/hives/queries'
import { localDay } from '@/features/hives/schema'
import { TimelineList } from '@/features/hives/TimelineList'
import { useTimeline } from '@/features/hives/useTimeline'
import { hiveStatusLabels, label } from '@/lib/labels'

export default function HiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const owner = useRole() === 'owner'
  const { hive, loading } = useHive(id)
  const today = localDay()
  const attention = useHiveAttentionData(id, today)
  const queue = useHiveQueue(id)
  const timeline = useTimeline(id, hive?.organization_id ?? '')
  const [showFacts, setShowFacts] = useState(false)

  if (!hive)
    return loading ? null : <NotAvailable icon={Hexagon} title="Esta colmena ya no existe." />

  const lastInspection = timeline.items.find((i) => i.kind === 'inspection') ?? null

  return (
    <View className="flex-1 bg-bg-soft">
      <Screen>
        <BackButton />
        {hive.apiary_name ? (
          <Text className="font-sans text-body text-muted">{hive.apiary_name}</Text>
        ) : null}
        <View className="flex-row flex-wrap items-center gap-3">
          <Text accessibilityRole="header" className="font-display text-title text-text">
            {hive.name}
          </Text>
          {hive.status !== 'active' ? (
            <Badge label={label(hiveStatusLabels, hive.status)} tone="danger" />
          ) : null}
        </View>
        {queue.attention > 0 ? (
          <SyncChip
            state="attention"
            count={queue.attention}
            onPress={() => router.navigate('/pending')}
          />
        ) : queue.pending > 0 ? (
          <SyncChip state="pending" count={queue.pending} />
        ) : null}
        <AttentionCard items={hiveAttention(attention.last, attention.treatments, today)} />
        <LastInspectionCard item={lastInspection?.kind === 'inspection' ? lastInspection : null} />
        <Button
          variant="secondary"
          icon={showFacts ? ChevronUp : ChevronDown}
          label={showFacts ? 'Ocultar datos de la colmena' : 'Ver datos de la colmena'}
          onPress={() => setShowFacts((v) => !v)}
        />
        {showFacts ? <HiveFacts hive={hive} /> : null}
        <Button
          variant="secondary"
          icon={QrCode}
          label="Etiqueta QR"
          onPress={() => router.push({ pathname: '/hive/[id]/label', params: { id } })}
        />
        {owner ? (
          <Button
            variant="secondary"
            icon={Pencil}
            label="Editar colmena"
            onPress={() => router.push({ pathname: '/hive/[id]/edit', params: { id } })}
          />
        ) : null}
        <TimelineList timeline={timeline} />
      </Screen>
      <View
        className="border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          icon={ClipboardCheck}
          label="Nueva revisión"
          className="min-h-field"
          onPress={() => router.push({ pathname: '/hive/[id]/inspect', params: { id } })}
        />
      </View>
    </View>
  )
}
