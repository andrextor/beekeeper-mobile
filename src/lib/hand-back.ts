// One value handed from a screen back to the one that opened it (expo-router has no return value):
// the new hive of a split for its event form, an event for field mode's draft. Taken once.
const slots = new Map<string, unknown>()

export function handBack(key: string, value: unknown): void {
  slots.set(key, value)
}

export function takeHandBack(key: string): unknown {
  const value = slots.get(key)
  slots.delete(key)
  return value
}
