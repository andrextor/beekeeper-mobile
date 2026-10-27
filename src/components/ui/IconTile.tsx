import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

export type IconTileTone = 'primary' | 'accent' | 'danger'

const look: Record<IconTileTone, { box: string; ink: string }> = {
  primary: { box: 'bg-primary-soft', ink: color.onPrimarySoft },
  accent: { box: 'bg-accent-soft', ink: color.text },
  danger: { box: 'bg-danger-soft', ink: color.onDangerSoft },
}

/** The icon of a list row on a soft rounded square, tinted by what the row needs. */
export function IconTile({
  icon: Icon,
  tone = 'primary',
}: {
  icon: LucideIcon
  tone?: IconTileTone
}) {
  const { box, ink } = look[tone]
  return (
    <View className={cx('size-11 items-center justify-center rounded-[14px]', box)}>
      <Icon color={ink} size={22} strokeWidth={2.25} />
    </View>
  )
}
