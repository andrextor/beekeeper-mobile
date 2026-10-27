import { Text, View } from 'react-native'

import { PressScale } from '@/components/ui/PressScale'
import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { observedLabels } from '@/lib/labels'
import { choiceBox } from './choice'
import { FieldLabel } from './FieldLabel'

export type Observed = keyof typeof observedLabels

type Props<T extends string> = {
  label: string
  value: T | null
  onChange: (value: T | null) => void
  /** Three options in order; defaults to Sí / No / No revisado. */
  labels?: Readonly<Record<T, string>>
}

/** Three 72-dp segments; tapping the chosen one again clears it. */
export function TriStateField<T extends string = Observed>({
  label,
  value,
  onChange,
  labels = observedLabels as unknown as Readonly<Record<T, string>>,
}: Props<T>) {
  const options = Object.keys(labels) as T[]
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-3">
      <FieldLabel label={label} />
      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <PressScale
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={withTap(() => onChange(selected ? null : option))}
              className={cx(
                'min-h-field flex-1 items-center justify-center rounded-button border-2 px-1',
                choiceBox(selected),
              )}
            >
              <Text className="text-center font-sans-semibold text-body text-text">
                {labels[option]}
              </Text>
            </PressScale>
          )
        })}
      </View>
    </View>
  )
}
