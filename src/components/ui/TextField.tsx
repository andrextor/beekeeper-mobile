import { Text, TextInput, type TextInputProps, View } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

type Props = Omit<TextInputProps, 'className'> & {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, ...input }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="font-sans-semibold text-body text-text">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={color.muted}
        className={cx(
          'min-h-target rounded-button border-2 bg-surface px-4 font-sans text-body text-text',
          error ? 'border-danger' : 'border-border focus:border-primary',
        )}
        {...input}
      />
      {error ? (
        <Text className="font-sans-semibold text-caption text-danger">{error}</Text>
      ) : hint ? (
        <Text className="font-sans text-caption text-muted">{hint}</Text>
      ) : null}
    </View>
  )
}
