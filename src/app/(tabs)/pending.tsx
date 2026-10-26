import { NetworkStateType, useNetworkState } from 'expo-network'
import { router } from 'expo-router'
import { RefreshCw } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { SyncChip } from '@/components/ui/SyncChip'
import { Toast } from '@/components/ui/Toast'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { useLocalQuery } from '@/db/useLocalQuery'
import { useSession } from '@/features/auth/session'
import { DraftCard, useDrafts } from '@/features/inspections/DraftCard'
import { discardChange } from '@/features/sync/discard'
import { allowMobileDataOnce } from '@/features/sync/network-policy'
import { PendingList } from '@/features/sync/PendingList'
import { entryTitle, type PendingEntry, usePendingEntries } from '@/features/sync/pending'
import { relabelHive } from '@/features/sync/relabel'
import { exclusive, syncNow } from '@/features/sync/triggers'
import { type SyncStatus, useSyncStatus } from '@/features/sync/useSyncStatus'
import { messageFor } from '@/lib/errors'
import { formatRelative, plural } from '@/lib/format'
import { newQrCode } from '@/lib/qr-code'

function StatusChip({ status }: { status: SyncStatus }) {
  if (status.attention > 0) return <SyncChip state="attention" count={status.attention} />
  if (status.pending > 0 && !status.online) {
    const saved = plural(status.pending, 'guardado', 'guardados')
    return <SyncChip state="saved" label={`Sin conexión — ${saved} en este dispositivo`} />
  }
  if (status.pending > 0) return <SyncChip state="pending" count={status.pending} />
  return <SyncChip state="synced" />
}

function Header({ status }: { status: SyncStatus }) {
  const { state } = useSession()
  const onWifi = useNetworkState().type === NetworkStateType.WIFI
  const waitingPhotos =
    useLocalQuery<{ n: number }>(
      `select count(*) as n from photos p join outbox o on o.table_name = 'photos' and o.row_id = p.id
       where p._on_server = 0 and o.state = 'pending' and p.deleted_at is null
         and (p.inspection_id is null or exists (select 1 from inspections i where i.id = p.inspection_id))`,
      [],
      ['photos', 'outbox'],
    ).rows[0]?.n ?? 0
  const drafts = useDrafts({
    organizationId: state.status === 'signedIn' ? (state.activeOrganizationId ?? '') : '',
  })
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Pendientes
      </Text>
      <StatusChip status={status} />
      <Button
        icon={RefreshCw}
        label="Sincronizar ahora"
        loading={status.running}
        onPress={() => void syncNow()}
      />
      <FormError message={status.error} />
      {waitingPhotos > 0 && !onWifi ? (
        <View className="gap-2 rounded-card border-2 border-accent p-3">
          <Text className="font-sans-semibold text-body text-text">
            {`${plural(waitingPhotos, 'foto esperando', 'fotos esperando')} Wi-Fi`}
          </Text>
          <Button
            variant="secondary"
            label="Subir ahora con datos"
            onPress={() => {
              allowMobileDataOnce()
              void syncNow()
            }}
          />
        </View>
      ) : null}
      <Text className="font-sans text-caption text-muted">
        {status.lastSyncAt
          ? `Última sincronización ${formatRelative(status.lastSyncAt)}`
          : 'Todavía no se ha sincronizado en este teléfono.'}
      </Text>
      {drafts.length ? (
        <Text accessibilityRole="header" className="pt-2 font-display text-section text-text">
          Revisiones sin terminar
        </Text>
      ) : null}
      {drafts.map((d) => (
        <DraftCard
          key={d.id}
          draft={d}
          showHive
          onContinue={() =>
            router.push({
              pathname: '/hive/[id]/inspect',
              params: d.is_edit ? { id: d.hive_id, inspectionId: d.id } : { id: d.hive_id },
            })
          }
        />
      ))}
    </View>
  )
}

const forms = { apiaries: '/apiary/[id]/edit', hives: '/hive/[id]/edit' } as const

const isDeletion = (entry: PendingEntry) =>
  (JSON.parse(entry.payload) as { deleted_at?: unknown }).deleted_at != null

/** The record's form; a repeated name arrives highlighted (spec M4 → Server rejections). */
function review(entry: PendingEntry) {
  if (entry.table_name !== 'apiaries' && entry.table_name !== 'hives') return
  const nameError = entry.last_error_code === 'duplicate_name' ? (entry.last_error ?? '') : ''
  router.push({ pathname: forms[entry.table_name], params: { id: entry.row_id, nameError } })
}

export default function PendingScreen() {
  const insets = useSafeAreaInsets()
  const status = useSyncStatus()
  const entries = usePendingEntries()
  const [discarding, setDiscarding] = useState<PendingEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const undone = useRef(false)

  // A re-label whose code another hive has (spec M5): a fresh code, the same queued event.
  const newCode = async (entry: PendingEntry) => {
    try {
      let saved = false
      await exclusive(async () => {
        saved = await relabelHive(await getDb(), entry.row_id, newQrCode())
      })
      if (saved) showToast('Código nuevo guardado. Imprime la etiqueta otra vez.')
      else setError('Esta colmena ya no está en el teléfono. Usa "Descartar cambio".')
    } catch (e) {
      setError(messageFor(e))
    }
  }

  // A failed deletion has no form to open: "Descartar cambio" restores it.
  const fixFor = (entry: PendingEntry) => {
    if (entry.table_name === 'hives' && entry.last_error_code === 'qr_taken') {
      return { label: 'Generar otro código', onPress: () => void newCode(entry) }
    }
    if (entry.table_name in forms && !isDeletion(entry)) {
      return { label: 'Revisar', onPress: () => review(entry) }
    }
    return null
  }

  const discard = async (entry: PendingEntry) => {
    try {
      await exclusive(() => discardChange(entry))
    } catch (e) {
      setError(messageFor(e))
    }
  }

  // The change is discarded when the undo window closes without "Deshacer".
  const closeUndoWindow = () => {
    const entry = discarding
    setDiscarding(null)
    if (entry && !undone.current) void discard(entry)
  }

  return (
    <View className="flex-1 bg-bg-soft" style={{ paddingTop: insets.top }}>
      <PendingList
        entries={entries.filter((e) => e.id !== discarding?.id)}
        header={<Header status={status} />}
        refreshing={status.running}
        onRefresh={() => void syncNow()}
        fixFor={fixFor}
        onDiscard={(entry) => {
          // A second discard inside the window closes the first one's window now.
          if (discarding && !undone.current) void discard(discarding)
          undone.current = false
          setDiscarding(entry)
        }}
      />
      <Toast
        message={discarding ? `Cambio descartado: ${entryTitle(discarding)}` : null}
        onUndo={() => {
          undone.current = true
        }}
        onHide={closeUndoWindow}
      />
      <Toast tone="danger" message={error} onHide={() => setError(null)} />
    </View>
  )
}
