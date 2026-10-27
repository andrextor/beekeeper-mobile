import { Pressable, Text } from 'react-native'

/** A secondary way out that must not compete with the primary button; ≥ 48 dp tall. */
export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      className="min-h-target justify-center px-2 active:opacity-70"
    >
      <Text className="font-sans-bold text-body text-on-primary-soft underline">{label}</Text>
    </Pressable>
  )
}
