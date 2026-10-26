import { RefreshCw } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { SyncChip } from '@/components/ui/SyncChip'
import { Toast } from '@/components/ui/Toast'
import { discardChange } from '@/features/sync/discard'
import { type PendingEntry, usePendingEntries } from '@/features/sync/pending'
import { PendingList } from '@/features/sync/PendingList'
import { requestSync } from '@/features/sync/triggers'
import { type SyncStatus, useSyncStatus } from '@/features/sync/useSyncStatus'
import { messageFor } from '@/lib/errors'
import { formatRelative, plural } from '@/lib/format'

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
        onPress={() => void requestSync('full')}
      />
      <FormError message={status.error} />
      <Text className="font-sans text-caption text-muted">
        {status.lastSyncAt
          ? `Última sincronización ${formatRelative(status.lastSyncAt)}`
          : 'Todavía no se ha sincronizado en este teléfono.'}
      </Text>
    </View>
  )
}

export default function PendingScreen() {
  const insets = useSafeAreaInsets()
  const status = useSyncStatus()
  const entries = usePendingEntries()
  const [discarding, setDiscarding] = useState<PendingEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const undone = useRef(false)

  // The change is discarded when the undo window closes without "Deshacer".
  const closeUndoWindow = async () => {
    const entry = discarding
    setDiscarding(null)
    if (!entry || undone.current) return
    try {
      await discardChange(entry)
    } catch (e) {
      setError(messageFor(e))
    }
  }

  return (
    <View className="flex-1 bg-bg-soft" style={{ paddingTop: insets.top }}>
      <PendingList
        entries={entries.filter((e) => e.id !== discarding?.id)}
        header={<Header status={status} />}
        refreshing={status.running}
        onRefresh={() => void requestSync('full')}
        onDiscard={(entry) => {
          undone.current = false
          setDiscarding(entry)
        }}
      />
      <Toast
        message={discarding ? 'Cambio descartado' : null}
        onUndo={() => {
          undone.current = true
        }}
        onHide={closeUndoWindow}
      />
      <Toast tone="danger" message={error} onHide={() => setError(null)} />
    </View>
  )
}
