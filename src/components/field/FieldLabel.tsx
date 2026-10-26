import { Text, View } from 'react-native'

/** Field-control title with the current value spelled out, so it reads at arm's length and in TalkBack. */
export function FieldLabel({ label, value }: { label: string; value?: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-2">
      <Text className="font-sans-semibold text-field-label text-text">{label}</Text>
      {value ? <Text className="font-sans-semibold text-body text-muted">{value}</Text> : null}
    </View>
  )
}
