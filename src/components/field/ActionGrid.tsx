import { View } from 'react-native'

import { ActionTile, type FieldAction } from './ActionTile'

/** Two columns of 96-dp tiles; an odd last tile keeps half width so tiles never change size. */
export function ActionGrid({ actions }: { actions: FieldAction[] }) {
  const rows: FieldAction[][] = []
  for (let i = 0; i < actions.length; i += 2) rows.push(actions.slice(i, i + 2))
  return (
    <View className="gap-3">
      {rows.map((row, r) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list, labels may repeat
        <View key={r} className="flex-row gap-3">
          {row.map((action, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list, labels may repeat
            <ActionTile key={i} {...action} />
          ))}
          {row.length === 1 && <View className="flex-1" />}
        </View>
      ))}
    </View>
  )
}
