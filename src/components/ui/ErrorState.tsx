import { RotateCw, TriangleAlert } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Button } from './Button'
import { CellIcon } from './CellIcon'

type Props = { title: string; body: string; onRetry?: () => void }

export function ErrorState({ title, body, onRetry }: Props) {
  return (
    <View
      accessibilityRole="alert"
      className="shrink grow items-center justify-center gap-3 px-6 py-10"
    >
      <CellIcon icon={TriangleAlert} tone="danger" />
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
