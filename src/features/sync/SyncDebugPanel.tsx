import { useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useLocalQuery } from '@/db/useLocalQuery'
import { setForcedFailure } from './push'

/** Dev only: forced push failures to watch the backoff, the outbox and the pull cursors. */
export function SyncDebugPanel() {
  const [failing, setFailing] = useState(false)
  const outbox = useLocalQuery<{ id: string; state: string; attempts: number }>(
    'select id, state, attempts from outbox order by created_at limit 30',
    [],
    ['outbox'],
  ).rows
  const cursors = useLocalQuery<{ organization_id: string; table_name: string; cursor: string }>(
    'select organization_id, table_name, cursor from sync_state order by organization_id, table_name',
    [],
    ['sync_state'],
  ).rows

  return (
    <View className="gap-4">
      <Button
        variant={failing ? 'danger' : 'secondary'}
        label={failing ? 'Forzar error: activado' : 'Forzar error: apagado'}
        onPress={() => {
          setForcedFailure(!failing)
          setFailing(!failing)
        }}
      />
      <Card className="gap-1">
        <Text className="font-sans-semibold text-body text-text">Outbox</Text>
        {outbox.map((o) => (
          <Text key={o.id} className="font-mono text-caption text-muted">
            {o.id.slice(0, 22)} {o.state} ×{o.attempts}
          </Text>
        ))}
      </Card>
      <Card className="gap-1">
        <Text className="font-sans-semibold text-body text-text">Cursores</Text>
        {cursors.map((c) => (
          <Text
            key={`${c.organization_id}/${c.table_name}`}
            className="font-mono text-caption text-muted"
          >
            {c.organization_id.slice(0, 8) || 'perfiles'} {c.table_name} {c.cursor.slice(0, 19)}
          </Text>
        ))}
      </Card>
    </View>
  )
}
