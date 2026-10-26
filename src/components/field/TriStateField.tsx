import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { tapHaptic } from '@/lib/haptics'
import { observedLabels } from '@/lib/labels'
import { FieldLabel } from './FieldLabel'

export type Observed = keyof typeof observedLabels
const options = Object.keys(observedLabels) as Observed[]

type Props = {
  label: string
  value: Observed | null
  onChange: (value: Observed | null) => void
}

/** Sí / No / No revisado in three 72-dp segments; tapping the chosen one again clears it. */
export function TriStateField({ label, value, onChange }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-3">
      <FieldLabel label={label} />
      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                tapHaptic()
                onChange(selected ? null : option)
              }}
              className={cx(
                'min-h-field flex-1 items-center justify-center rounded-button border-2 px-1 active:opacity-80',
                selected ? 'border-deep bg-accent' : 'border-border bg-surface',
              )}
            >
              <Text className="text-center font-sans-semibold text-body text-text">
                {observedLabels[option]}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
