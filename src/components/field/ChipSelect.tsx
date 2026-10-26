import { Check } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { tapHaptic } from '@/lib/haptics'
import { color } from '@/lib/theme'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  options: Readonly<Record<string, string>>
  value: readonly string[]
  onChange: (value: string[]) => void
  /** Single choice when false: tapping another chip replaces, tapping the chosen one clears. */
  multiple?: boolean
}

export function ChipSelect({ label, options, value, onChange, multiple = false }: Props) {
  const toggle = (option: string) => {
    tapHaptic()
    const on = value.includes(option)
    if (multiple) onChange(on ? value.filter((v) => v !== option) : [...value, option])
    else onChange(on ? [] : [option])
  }

  return (
    <View
      accessibilityRole={multiple ? undefined : 'radiogroup'}
      accessibilityLabel={label}
      className="gap-3"
    >
      <FieldLabel label={label} />
      <View className="flex-row flex-wrap gap-3">
        {Object.entries(options).map(([option, text]) => {
          const selected = value.includes(option)
          return (
            <Pressable
              key={option}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={multiple ? { checked: selected } : { selected }}
              onPress={() => toggle(option)}
              className={cx(
                'min-h-16 flex-row items-center gap-2 rounded-full border-2 px-5 active:opacity-80',
                selected ? 'border-deep bg-accent' : 'border-border bg-surface',
              )}
            >
              {selected && <Check color={color.onAccent} size={22} strokeWidth={2.75} />}
              <Text className="font-sans-semibold text-body text-text">{text}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
