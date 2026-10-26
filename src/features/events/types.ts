import type { EventType } from './schemas'

/** Types whose owner form changes the hive; a reviewer's shows "Avisa al propietario…". */
export const withHiveEffect: ReadonlySet<EventType> = new Set([
  'queen_change',
  'transfer',
  'loss',
  'merge',
  'split',
  'swarm',
])
