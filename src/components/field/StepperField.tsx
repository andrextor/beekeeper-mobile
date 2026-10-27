import { Minus, Plus } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { formatNumber } from '@/lib/format'
import { withTap } from '@/lib/haptics'
import { color, iconSize, iconStroke, shadow } from '@/lib/theme'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min: number
  max: number
  step?: number
  unit?: string
  /** Where + lands from "not recorded" (default `min`), e.g. this year for the queen's year. */
  start?: number
}

/** − value + with 72-dp buttons; + from "not recorded" lands on `start`, − from min goes back to it. */
export function StepperField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  start = min,
}: Props) {
  const more = withTap(() => onChange(value === null ? start : Math.min(max, value + step)))
  const less = withTap(() =>
    onChange(value === null || value <= min ? null : Math.max(min, value - step)),
  )
  const shown = value === null ? null : `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
  const lessDisabled = value === null
  const moreDisabled = value !== null && value >= max

  return (
    <View className="gap-3">
      <FieldLabel label={label} />
      <View className="flex-row items-center gap-2 rounded-full bg-fill p-1.5">
        <StepButton label={`Menos ${label}`} disabled={lessDisabled} onPress={less} plus={false} />
        <Text
          accessibilityLabel={`${label}: ${shown ?? 'sin dato'}`}
          accessibilityLiveRegion="polite"
          className={cx(
            'flex-1 text-center',
            shown
              ? 'font-display text-field-value text-text'
              : 'font-sans-semibold text-body text-muted',
          )}
        >
          {shown ?? 'Sin dato'}
        </Text>
        <StepButton label={`Más ${label}`} disabled={moreDisabled} onPress={more} plus />
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
        'size-field items-center justify-center rounded-full active:opacity-80',
        plus ? 'bg-accent' : 'bg-surface',
        disabled && 'opacity-40',
      )}
      style={plus ? undefined : shadow.card}
    >
      <Icon
        color={plus ? color.onAccent : color.text}
        size={iconSize.field}
        strokeWidth={iconStroke.field}
      />
    </Pressable>
  )
}
