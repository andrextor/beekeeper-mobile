import { createLucideIcon } from 'lucide-react-native'

// The hive mark: three honeycomb cells on Lucide's 24-unit grid, so it takes the same props.
export const Honeycomb = createLucideIcon('honeycomb', [
  ['path', { d: 'M7.67 3.25 12 5.75v5l-4.33 2.5-4.33-2.5v-5z', key: 'left' }],
  ['path', { d: 'M16.33 3.25 20.66 5.75v5l-4.33 2.5L12 10.75v-5z', key: 'right' }],
  ['path', { d: 'M12 10.75l4.33 2.5v5L12 20.75l-4.33-2.5v-5z', key: 'bottom' }],
])
