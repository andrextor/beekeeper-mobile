/** `push` uploads the outbox; `full` also pulls. */
export type Mode = 'push' | 'full'

/**
 * One run at a time. Requests during a run fold into a single extra run at its end (a full one if
 * any asked for it), so triggers never overlap and a run never schedules itself.
 */
export function singleFlight(run: (mode: Mode) => Promise<void>): (mode: Mode) => Promise<void> {
  let current: Promise<void> | null = null
  let again: Mode | null = null

  return (mode) => {
    if (current) {
      again = again === 'full' || mode === 'full' ? 'full' : 'push'
      return current
    }
    current = (async () => {
      let next: Mode | null = mode
      while (next) {
        again = null
        try {
          await run(next)
        } catch {
          // The run reports its own error; the next trigger tries again.
        }
        next = again
      }
    })().finally(() => {
      current = null
    })
    return current
  }
}
