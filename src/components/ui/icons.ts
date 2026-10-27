import { createLucideIcon } from 'lucide-react-native'

// The hive mark: three honeycomb cells on Lucide's 24-unit grid, so it takes the same props.
// Outline plus the three inner walls: every edge is stroked once (no darker shared edges).
export const Honeycomb = createLucideIcon('honeycomb', [
  [
    'path',
    {
      d: 'M7.67 3.25 12 5.75l4.33-2.5 4.33 2.5v5l-4.33 2.5v5L12 20.75l-4.33-2.5v-5l-4.33-2.5v-5z',
      key: 'outline',
    },
  ],
  ['path', { d: 'M12 5.75v5M7.67 13.25 12 10.75l4.33 2.5', key: 'walls' }],
])
