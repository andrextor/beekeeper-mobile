import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { choiceBox } from './choice'
import { FieldLabel } from './FieldLabel'

export type ScaleValue = 1 | 2 | 3 | 4 | 5
const steps: ScaleValue[] = [1, 2, 3, 4, 5]

type Props = {
  label: string
  value: ScaleValue | null
  onChange: (value: ScaleValue | null) => void
  words: Readonly<Record<ScaleValue, string>>
}

/** Five circles of up to 64 dp, 12 dp apart; tapping the chosen one again clears it (not recorded). */
export function ScaleField({ label, value, onChange, words }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-3">
      <FieldLabel label={label} value={value ? words[value] : 'Sin dato'} />
      <View className="flex-row justify-between gap-3">
        {steps.map((step) => {
          const selected = step === value
          return (
            <Pressable
              key={step}
              accessibilityRole="radio"
              accessibilityLabel={`${step}, ${words[step]}`}
              accessibilityState={{ selected }}
              onPress={withTap(() => onChange(selected ? null : step))}
              className={cx(
                'aspect-square max-w-16 flex-1 items-center justify-center rounded-full border-2 active:opacity-80',
                choiceBox(selected),
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
