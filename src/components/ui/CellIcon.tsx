import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { color } from '@/lib/theme'

type Tone = 'primary' | 'danger'

const look: Record<Tone, { fill: string; ink: string }> = {
  primary: { fill: color.primarySoft, ink: color.onPrimarySoft },
  danger: { fill: color.dangerSoft, ink: color.onDangerSoft },
}

// A pointy-top honeycomb cell; the same-colour stroke rounds its corners.
const cell = 'M44 6 79 26v36L44 82 9 62V26z'

/** The big icon of empty, error and not-available states, sitting in one honeycomb cell. */
export function CellIcon({ icon: Icon, tone = 'primary' }: { icon: LucideIcon; tone?: Tone }) {
  const { fill, ink } = look[tone]
  return (
    <View className="size-[88px] items-center justify-center">
      <Svg width={88} height={88} viewBox="0 0 88 88" style={{ position: 'absolute' }}>
        <Path d={cell} fill={fill} stroke={fill} strokeWidth={10} strokeLinejoin="round" />
      </Svg>
      <Icon color={ink} size={36} strokeWidth={2} />
    </View>
  )
}
