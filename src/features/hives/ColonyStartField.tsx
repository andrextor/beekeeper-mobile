import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { CalendarDays, X } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { FieldLabel } from '@/components/field/FieldLabel'
import { Button } from '@/components/ui/Button'
import { formatCalendarDate, formatColonyAge } from '@/lib/format'
import { localDay } from './schema'

type Props = { value: string | null; error?: string; onChange: (value: string | null) => void }

/** Android's own calendar, never after today; the age shows as soon as there is a date. */
export function ColonyStartField({ value, error, onChange }: Props) {
  const pick = () => {
    const [year = 0, month = 1, day = 1] = (value ?? '').split('-').map(Number)
    DateTimePickerAndroid.open({
      mode: 'date',
      value: value ? new Date(year, month - 1, day) : new Date(),
      maximumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(localDay(date))
      },
    })
  }

  return (
    <View className="gap-3">
      <FieldLabel
        label="Inicio de la colonia"
        value={value ? formatCalendarDate(value) : undefined}
      />
      <Text className="font-sans text-body text-muted">
        {value ? `Edad: ${formatColonyAge(value)}` : 'Edad desconocida'}
      </Text>
      <Button
        variant="secondary"
        icon={CalendarDays}
        label={value ? 'Cambiar fecha' : 'Elegir fecha'}
        onPress={pick}
      />
      {value ? (
        <Button variant="secondary" icon={X} label="Quitar fecha" onPress={() => onChange(null)} />
      ) : null}
      {error ? <Text className="font-sans-semibold text-caption text-danger">{error}</Text> : null}
    </View>
  )
}
