import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg'

import { color } from '@/lib/theme'

/** Faint honeycomb drawn behind a `deep` hero band; decoration only. */
export function HoneycombPattern() {
  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      width="100%"
      height="100%"
      style={{ position: 'absolute', opacity: 0.16 }}
    >
      <Defs>
        <Pattern id="comb" width={42} height={72.75} patternUnits="userSpaceOnUse">
          <Path
            d="M21 0 42 12.12v24.25L21 48.5 0 36.37V12.12zM21 48.5v24.25"
            fill="none"
            stroke={color.accent}
            strokeWidth={2}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#comb)" />
    </Svg>
  )
}
