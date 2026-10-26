import { Text, View } from 'react-native'

/** One labelled fact of a record; an empty value is left out. */
export function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <View className="gap-0.5">
      <Text className="font-sans text-caption text-muted">{label}</Text>
      <Text className="font-sans text-body text-text">{value}</Text>
    </View>
  )
}
