import { Text, View } from 'react-native'

import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { Honeycomb } from '@/components/ui/icons'
import { formatLastInspection } from '@/lib/format'
import {
  attentionLevelLabels,
  hiveStatusLabels,
  hiveTypeLabels,
  label,
  queenColorLabels,
} from '@/lib/labels'
import { QueenDot } from './QueenDot'
import type { HiveSummary } from './queries'

const statusTones: Readonly<Record<string, BadgeTone>> = {
  dead: 'danger',
  absconded: 'danger',
}

export function HiveListItem({ hive, onPress }: { hive: HiveSummary; onPress: () => void }) {
  const urgent = hive.attention_level === 'urgent'
  const soon = hive.attention_level === 'soon'
  const type = hive.hive_type ? label(hiveTypeLabels, hive.hive_type) : null
  return (
    <Card onPress={onPress} className="min-h-target flex-row items-center gap-3">
      <IconTile icon={Honeycomb} tone={urgent ? 'danger' : soon ? 'accent' : 'primary'} />
      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-display text-section text-text">{hive.name}</Text>
          {hive.status !== 'active' ? (
            <Badge
              label={label(hiveStatusLabels, hive.status)}
              tone={statusTones[hive.status] ?? 'neutral'}
            />
          ) : null}
          {urgent || soon ? (
            <Badge
              label={label(attentionLevelLabels, hive.attention_level)}
              tone={urgent ? 'danger' : 'accent'}
            />
          ) : null}
        </View>
        {type || hive.queen_color ? (
          <View className="flex-row flex-wrap items-center gap-2">
            {type ? <Text className="font-sans text-caption text-muted">{type}</Text> : null}
            {hive.queen_color ? (
              <>
                <QueenDot color={hive.queen_color} />
                <Text className="font-sans text-caption text-muted">
                  {`Reina ${label(queenColorLabels, hive.queen_color).toLowerCase()}${hive.queen_year ? ` ${hive.queen_year}` : ''}`}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}
        <Text className="font-sans text-caption text-muted">
          {formatLastInspection(hive.last_inspection)}
        </Text>
      </View>
    </Card>
  )
}
