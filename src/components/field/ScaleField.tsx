import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { tapHaptic } from '@/lib/haptics'
import { FieldLabel } from './FieldLabel'

export type ScaleValue = 1 | 2 | 3 | 4 | 5
const steps: ScaleValue[] = [1, 2, 3, 4, 5]

type Props = {
  label: string
  value: ScaleValue | null
  onChange: (value: ScaleValue | null) => void
  words: Readonly<Record<ScaleValue, string>>
}

/** Five 64-dp circles; tapping the chosen one again clears it (not recorded). */
export function ScaleField({ label, value, onChange, words }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-3">
      <FieldLabel label={label} value={value ? words[value] : 'Sin dato'} />
      <View className="flex-row justify-between">
        {steps.map((step) => {
          const selected = step === value
          return (
            <Pressable
              key={step}
              accessibilityRole="radio"
              accessibilityLabel={`${step}, ${words[step]}`}
              accessibilityState={{ selected }}
              onPress={() => {
                tapHaptic()
                onChange(selected ? null : step)
              }}
              className={cx(
                'size-16 items-center justify-center rounded-full border-2 active:opacity-80',
                selected ? 'border-deep bg-accent' : 'border-border bg-surface',
              )}
            >
              <Text className="font-display text-field-value text-text">{step}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
