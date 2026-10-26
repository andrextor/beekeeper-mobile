import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

import { localDay } from './dates'

/** Android's own calendar on a "YYYY-MM-DD" day; past days only unless `future`. */
export function pickDay(
  current: string | null,
  onPick: (day: string) => void,
  future = false,
): void {
  const [year = 0, month = 1, day = 1] = (current ?? '').split('-').map(Number)
  DateTimePickerAndroid.open({
    mode: 'date',
    value: current ? new Date(year, month - 1, day) : new Date(),
    ...(future ? {} : { maximumDate: new Date() }),
    onChange: (event, date) => {
      if (event.type === 'set' && date) onPick(localDay(date))
    },
  })
}
