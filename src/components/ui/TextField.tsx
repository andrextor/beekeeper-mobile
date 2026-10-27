import { CircleAlert } from 'lucide-react-native'
import { type ReactNode, useRef, useState } from 'react'
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

type Props = Omit<TextInputProps, 'className'> & {
  label: string
  hint?: string
  error?: string
  /** Inside the field on the right, e.g. the show-password toggle. */
  trailing?: ReactNode
}

/** Filled field with its label inside; focus draws a green ring, an error a red one plus icon. */
export function TextField({ label, hint, error, trailing, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false)
  const ref = useRef<TextInput>(null)
  return (
    <View className="gap-1.5">
      <Pressable
        accessible={false}
        onPress={() => ref.current?.focus()}
        className={cx(
          'min-h-16 flex-row items-center rounded-field border-2',
          error
            ? 'border-danger bg-danger-soft'
            : focused
              ? 'border-primary bg-surface'
              : 'border-transparent bg-fill',
        )}
      >
        <View className="flex-1 gap-0.5 px-4 py-2">
          <Text
            className={cx(
              'font-sans-semibold text-caption',
              error ? 'text-on-danger-soft' : focused ? 'text-on-primary-soft' : 'text-muted',
            )}
          >
            {label}
          </Text>
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={error ?? hint}
            placeholderTextColor={color.muted}
            className="min-h-7 p-0 font-sans text-body text-text"
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            {...input}
          />
        </View>
        {trailing}
      </Pressable>
      {error ? (
        <View className="flex-row items-center gap-1.5 px-1">
          <CircleAlert color={color.danger} size={18} strokeWidth={2.25} />
          <Text className="flex-1 font-sans-semibold text-caption text-on-danger-soft">
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text className="px-1 font-sans text-caption text-muted">{hint}</Text>
      ) : null}
    </View>
  )
}
