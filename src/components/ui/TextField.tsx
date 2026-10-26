import type { ReactNode } from 'react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

type Props = Omit<TextInputProps, 'className'> & {
  label: string
  hint?: string
  error?: string
  /** Inside the field on the right, e.g. the show-password toggle. */
  trailing?: ReactNode
}

export function TextField({ label, hint, error, trailing, ...input }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="font-sans-semibold text-body text-text">{label}</Text>
      <View
        className={cx(
          'min-h-target flex-row items-center rounded-button border-2 bg-surface',
          error ? 'border-danger' : 'border-border',
        )}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={color.muted}
          className="min-h-target flex-1 px-4 font-sans text-body text-text"
          {...input}
        />
        {trailing}
      </View>
      {error ? (
        <Text className="font-sans-semibold text-caption text-danger">{error}</Text>
      ) : hint ? (
        <Text className="font-sans text-caption text-muted">{hint}</Text>
      ) : null}
    </View>
  )
}
