import { Text } from 'react-native'

/** The heading of a block inside a screen (Historial, Fotos, a form card); TalkBack jumps by it. */
export function SectionTitle({ text }: { text: string }) {
  return (
    <Text accessibilityRole="header" className="font-display text-section text-text">
      {text}
    </Text>
  )
}
