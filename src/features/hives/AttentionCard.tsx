import { CalendarClock, type LucideIcon, Siren, Syringe, TriangleAlert } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { cx } from '@/lib/cx'
import { color, iconSize } from '@/lib/theme'
import type { AttentionItem } from './attention'

const looks: Record<AttentionItem['kind'], { icon: LucideIcon; danger: boolean }> = {
  urgent: { icon: Siren, danger: true },
  soon: { icon: TriangleAlert, danger: false },
  overdue: { icon: CalendarClock, danger: true },
  due_today: { icon: CalendarClock, danger: false },
  treatment: { icon: Syringe, danger: false },
}

/** Only rendered when something needs the beekeeper; icon + word, never color alone. */
export function AttentionCard({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null
  const danger = items.some((i) => looks[i.kind].danger)
  return (
    <View
      accessibilityRole="alert"
      className={cx('gap-3 rounded-card p-4', danger ? 'bg-danger-soft' : 'bg-accent-soft')}
    >
      {items.map((item) => {
        const { icon: Icon, danger: red } = looks[item.kind]
        return (
          <View key={item.kind + item.text} className="flex-row items-center gap-3">
            <Icon color={red ? color.danger : color.text} size={iconSize.field} />
            <Text className="flex-1 font-sans-semibold text-field-label text-text">
              {item.text}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
