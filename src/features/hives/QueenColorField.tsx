import { Pressable, Text, View } from 'react-native'

import { choiceBox } from '@/components/field/choice'
import { FieldLabel } from '@/components/field/FieldLabel'
import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { queenColorLabels } from '@/lib/labels'
import { type QueenColor, suggestQueenColor } from '@/lib/queen-color'
import { QueenDot } from './QueenDot'

const colors = Object.keys(queenColorLabels) as QueenColor[]

type Props = { value: string | null; year: number | null; onChange: (value: string | null) => void }

/** Five colour circles with their names plus "Sin marca"; the year's international colour is hinted. */
export function QueenColorField({ value, year, onChange }: Props) {
  const choice = (key: string | null, text: string) => {
    const selected = value === key
    return (
      <Pressable
        key={key ?? 'none'}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        onPress={withTap(() => onChange(key))}
        className={cx(
          'min-h-16 flex-row items-center gap-2 rounded-full border-2 px-4 active:opacity-80',
          choiceBox(selected),
        )}
      >
        {key ? <QueenDot color={key} /> : null}
        <Text className="font-sans-semibold text-body text-text">{text}</Text>
      </Pressable>
    )
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Color de marca" className="gap-3">
      <FieldLabel label="Color de marca" />
      {year ? (
        <Text className="font-sans text-caption text-muted">
          {`Color internacional para ${year}: ${queenColorLabels[suggestQueenColor(year)].toLowerCase()}`}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-3">
        {colors.map((key) => choice(key, queenColorLabels[key]))}
        {choice(null, 'Sin marca')}
      </View>
    </View>
  )
}
