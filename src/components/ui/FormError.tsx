import { Text } from 'react-native'

/** The error under a form, read aloud by TalkBack; renders nothing without a message. */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <Text accessibilityRole="alert" className="font-sans-semibold text-body text-danger">
      {message}
    </Text>
  )
}
