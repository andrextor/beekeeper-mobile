import type { LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { color, iconSize } from '@/lib/theme'
import { Button } from './Button'

type Props = {
  icon: LucideIcon
  title: string
  body?: string
  action?: { label: string; onPress: () => void }
}

export function EmptyState({ icon: Icon, title, body, action }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-10">
      <Icon color={color.primary} size={iconSize.state} strokeWidth={1.75} />
      <Text className="text-center font-display text-section text-text">{title}</Text>
      {body ? <Text className="text-center font-sans text-body text-muted">{body}</Text> : null}
      {action && <Button className="mt-2 self-stretch" {...action} />}
    </View>
  )
}
