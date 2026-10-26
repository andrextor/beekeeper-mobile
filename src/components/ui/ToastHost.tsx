import { useSyncExternalStore } from 'react'

import { Toast } from './Toast'

type Options = {
  onUndo?: () => void
  /** Runs when the toast closes without "Deshacer": the moment a removal becomes final. */
  onExpire?: () => void
  durationMs?: number
  tone?: 'success' | 'danger'
}
type Shown = Options & { message: string; key: number; undone?: boolean }

export const undoFailed = 'No se pudo deshacer. Inténtalo otra vez desde la pantalla.'

let shown: Shown | null = null
let key = 0
const watchers = new Set<() => void>()

function set(next: Shown | null) {
  shown = next
  for (const watch of watchers) watch()
}

/**
 * A toast that survives navigation: save, go back, and the next screen still says so. A toast
 * without "Deshacer" never covers one that has it: the undo window stays reachable.
 */
export function showToast(message: string, options: Options = {}) {
  if (shown?.onUndo && !options.onUndo) return
  // A newer undo toast closes the older window: what it was waiting for becomes final now.
  if (shown && !shown.undone) shown.onExpire?.()
  key += 1
  set({ message, key, ...options })
}

const subscribe = (watch: () => void) => {
  watchers.add(watch)
  return () => {
    watchers.delete(watch)
  }
}

// Clears the 64-dp tab bar; on other screens it just floats a little higher.
const aboveTabBar = 80

/** Mounted once in the root layout. */
export function ToastHost() {
  const current = useSyncExternalStore(subscribe, () => shown)
  return (
    <Toast
      key={current?.key}
      message={current?.message ?? null}
      tone={current?.tone}
      onUndo={
        current?.onUndo
          ? () => {
              current.undone = true
              current.onUndo?.()
            }
          : undefined
      }
      durationMs={current?.durationMs}
      bottomOffset={aboveTabBar}
      onHide={() => {
        if (current && !current.undone) current.onExpire?.()
        set(null)
      }}
    />
  )
}
