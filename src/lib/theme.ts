import colors from './colors.json'

/** For props NativeWind classes cannot reach (icon colors, native navigator options). */
export const color = {
  text: colors.deep,
  muted: colors.stone['700'],
  primary: colors.leaf,
  onPrimary: colors.white,
  accent: colors.honey,
  onAccent: colors.deep,
  danger: colors.danger,
  onDanger: colors.white,
  border: colors.stone['200'],
  bg: colors.white,
  bgSoft: colors.canvas,
  primarySoft: colors.primarySoft,
  onPrimarySoft: colors.onPrimarySoft,
  onDangerSoft: colors.onDangerSoft,
  mist: colors.mist,
  sprout: colors.sprout,
} as const

/** RN `boxShadow` (New Architecture); NativeWind's shadow classes do not reach Android. */
export const shadow = {
  card: { boxShadow: '0 2px 12px rgba(4, 48, 59, 0.07)' },
  raised: { boxShadow: '0 8px 24px rgba(4, 48, 59, 0.18)' },
  tabBar: { boxShadow: '0 -4px 16px rgba(4, 48, 59, 0.06)' },
} as const

export const iconSize = { standard: 24, field: 36, scan: 56, state: 56, hero: 64 } as const

export const iconStroke = { standard: 2, field: 2.25 } as const
