import { RotateCw, TriangleAlert } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { color } from '@/lib/theme'
import { Button } from './Button'

type Props = { title: string; body: string; onRetry?: () => void }

export function ErrorState({ title, body, onRetry }: Props) {
  return (
    <View accessibilityRole="alert" className="flex-1 items-center justify-center gap-3 px-6 py-10">
      <TriangleAlert color={color.danger} size={56} strokeWidth={1.75} />
      <Text className="text-center font-display text-section text-text">{title}</Text>
      <Text className="text-center font-sans text-body text-muted">{body}</Text>
      {onRetry && (
        <Button
          className="mt-2 self-stretch"
          variant="secondary"
          icon={RotateCw}
          label="Intentar de nuevo"
          onPress={onRetry}
        />
      )}
    </View>
  )
}
