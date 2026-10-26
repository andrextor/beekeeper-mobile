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
  bgSoft: colors.stone['50'],
} as const

export const iconSize = { standard: 24, field: 36, scan: 56 } as const

export const iconStroke = { standard: 2, field: 2.25 } as const
