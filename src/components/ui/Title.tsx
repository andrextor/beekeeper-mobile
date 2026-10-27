import { Text, View } from 'react-native'

/** The screen's large title; `eyebrow` is the small line above it (the finca, the apiary). */
export function Title({ text, eyebrow }: { text: string; eyebrow?: string | null }) {
  return (
    <View className="gap-1">
      {eyebrow ? (
        <Text className="font-sans-semibold text-caption text-muted">{eyebrow}</Text>
      ) : null}
      <Text accessibilityRole="header" className="font-display text-title text-text">
        {text}
      </Text>
    </View>
  )
}
