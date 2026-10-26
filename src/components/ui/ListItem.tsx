import { ChevronRight, type LucideIcon } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { color, iconSize } from '@/lib/theme'

type Props = {
  title: string
  subtitle?: string
  icon?: LucideIcon
  trailing?: ReactNode
  onPress?: () => void
}

export function ListItem({ title, subtitle, icon: Icon, trailing, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="min-h-target flex-row items-center gap-3 border-b border-border bg-surface px-4 py-3 active:bg-stone-100"
    >
      {Icon && <Icon color={color.text} size={iconSize.standard} />}
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold text-body text-text">{title}</Text>
        {subtitle ? <Text className="font-sans text-caption text-muted">{subtitle}</Text> : null}
      </View>
      {trailing}
      {onPress && <ChevronRight color={color.muted} size={iconSize.standard} />}
    </Pressable>
  )
}
