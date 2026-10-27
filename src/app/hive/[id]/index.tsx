import { router, useLocalSearchParams } from 'expo-router'
import {
  Camera,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ListPlus,
  Pencil,
  QrCode,
} from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BackButton } from '@/components/ui/BackButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Honeycomb } from '@/components/ui/icons'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { SyncChip } from '@/components/ui/SyncChip'
import { useRole, useSession } from '@/features/auth/session'
import { AttentionCard } from '@/features/hives/AttentionCard'
import { hiveAttention } from '@/features/hives/attention'
import { HiveFacts } from '@/features/hives/HiveFacts'
import { LastInspectionCard } from '@/features/hives/LastInspectionCard'
import {
  useActiveTreatments,
  useHive,
  useHiveQueue,
  useLatestInspection,
} from '@/features/hives/queries'
import { TimelineList } from '@/features/hives/TimelineList'
import { useTimeline } from '@/features/hives/useTimeline'
import { DraftCard, useDrafts } from '@/features/inspections/DraftCard'
import { PhotoGrid } from '@/features/photos/PhotoGrid'
import { usePhotos } from '@/features/photos/queries'
import { localDay } from '@/lib/dates'
import { hiveStatusLabels, label } from '@/lib/labels'

export default function HiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const owner = useRole() === 'owner'
  const { state } = useSession()
  const userId = state.status === 'signedIn' ? state.session.user.id : null
  const { hive, loading } = useHive(id)
  const today = localDay()
  const { latest, loading: latestLoading } = useLatestInspection(id)
  const treatments = useActiveTreatments(id, today)
  const queue = useHiveQueue(id)
  const timeline = useTimeline(id, hive?.organization_id ?? null)
  const [showFacts, setShowFacts] = useState(false)
  const drafts = useDrafts({ hiveId: id })
  const photos = usePhotos({ hiveId: id }, 6)
  const newDraft = drafts.find((d) => !d.is_edit)

  if (!hive)
    return loading ? null : <NotAvailable icon={Honeycomb} title="Esta colmena ya no existe." />

  return (
    <View className="flex-1 bg-bg-soft">
      <Screen
        hero={{
          title: hive.name,
          eyebrow: hive.apiary_name,
          children:
            hive.status !== 'active' ? (
              <Badge label={label(hiveStatusLabels, hive.status)} tone="danger" />
            ) : null,
        }}
      >
        <BackButton />
        {queue.attention > 0 ? (
          <SyncChip
            state="attention"
            count={queue.attention}
            onPress={() => router.navigate('/pending')}
          />
        ) : queue.pending > 0 ? (
          <SyncChip state="pending" count={queue.pending} />
        ) : null}
        {drafts.map((d) => (
          <DraftCard
            key={d.id}
            draft={d}
            onContinue={() =>
              router.push({
                pathname: '/hive/[id]/inspect',
                params: d.is_edit ? { id, inspectionId: d.id } : { id },
              })
            }
          />
        ))}
        <AttentionCard items={hiveAttention(latest?.inspection ?? null, treatments, today)} />
        {latestLoading ? null : <LastInspectionCard latest={latest} />}
        <Button
          variant="secondary"
          icon={showFacts ? ChevronUp : ChevronDown}
          label={showFacts ? 'Ocultar datos de la colmena' : 'Ver datos de la colmena'}
          onPress={() => setShowFacts((v) => !v)}
        />
        {showFacts ? <HiveFacts hive={hive} /> : null}
        <Button
          variant="accent"
          icon={ListPlus}
          label="Registrar actividad"
          onPress={() => router.push({ pathname: '/hive/[id]/event/new', params: { id } })}
        />
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
        <View className="gap-3">
          <Text accessibilityRole="header" className="font-display text-section text-text">
            Fotos
          </Text>
          {photos.length ? (
            <PhotoGrid
              photos={photos}
              onOpen={(photoId) =>
                router.push({ pathname: '/photo/[id]', params: { id: photoId } })
              }
            />
          ) : null}
          <Button
            variant="secondary"
            icon={Camera}
            label={photos.length ? 'Ver todas las fotos' : 'Tomar foto'}
            onPress={() =>
              photos.length
                ? router.push({ pathname: '/hive/[id]/photos', params: { id } })
                : router.push({ pathname: '/hive/[id]/camera', params: { id } })
            }
          />
        </View>
        <TimelineList
          timeline={timeline}
          canEditEvent={(createdBy) => owner || createdBy === userId}
        />
      </Screen>
      <View
        className="border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          icon={ClipboardCheck}
          label={newDraft ? 'Continuar revisión' : 'Nueva revisión'}
          className="min-h-field"
          onPress={() => router.push({ pathname: '/hive/[id]/inspect', params: { id } })}
        />
      </View>
    </View>
  )
}
