import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'

import { Button } from './Button'

/** Big "Volver" at the top of forms: gloves cannot rely on the system back gesture. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  if (!onPress && !router.canGoBack()) return null
  return (
    <Button
      variant="secondary"
      icon={ArrowLeft}
      label="Volver"
      className="self-start"
      onPress={onPress ?? (() => router.back())}
    />
  )
}
