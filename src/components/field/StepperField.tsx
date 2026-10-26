import { Minus, Plus } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { formatNumber } from '@/lib/format'
import { tapHaptic } from '@/lib/haptics'
import { color, iconSize, iconStroke } from '@/lib/theme'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min: number
  max: number
  step?: number
  unit?: string
}

/** − value + with 72-dp buttons; the first + from "not recorded" lands on min. */
export function StepperField({ label, value, onChange, min, max, step = 1, unit }: Props) {
  const change = (delta: number) => {
    tapHaptic()
    if (value === null) return onChange(min)
    onChange(Math.min(max, Math.max(min, value + delta)))
  }
  const shown = value === null ? '—' : `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
  const lessDisabled = value === null || value <= min
  const moreDisabled = value !== null && value >= max

  return (
    <View className="gap-3">
      <FieldLabel label={label} />
      <View className="flex-row items-center gap-3">
        <StepButton
          label={`Menos ${label}`}
          disabled={lessDisabled}
          onPress={() => change(-step)}
          plus={false}
        />
        <Text
          accessibilityLabel={`${label}: ${value === null ? 'sin dato' : shown}`}
          accessibilityLiveRegion="polite"
          className="flex-1 text-center font-display text-field-value text-text"
        >
          {shown}
        </Text>
        <StepButton
          label={`Más ${label}`}
          disabled={moreDisabled}
          onPress={() => change(step)}
          plus
        />
      </View>
    </View>
  )
}

function StepButton({
  label,
  disabled,
  onPress,
  plus,
}: {
  label: string
  disabled: boolean
  onPress: () => void
  plus: boolean
}) {
  const Icon = plus ? Plus : Minus
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cx(
        'size-field items-center justify-center rounded-button bg-accent active:opacity-80',
        disabled && 'opacity-40',
      )}
    >
      <Icon color={color.onAccent} size={iconSize.field} strokeWidth={iconStroke.field} />
    </Pressable>
  )
}
