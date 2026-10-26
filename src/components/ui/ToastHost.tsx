import { useSyncExternalStore } from 'react'

import { Toast } from './Toast'

type Shown = { message: string; onUndo?: () => void; durationMs?: number; key: number }

let shown: Shown | null = null
let key = 0
const watchers = new Set<() => void>()

function set(next: Shown | null) {
  shown = next
  for (const watch of watchers) watch()
}

/** A toast that survives navigation: save, go back, and the next screen still says so. */
export function showToast(
  message: string,
  options: { onUndo?: () => void; durationMs?: number } = {},
) {
  key += 1
  set({ message, key, ...options })
}

const subscribe = (watch: () => void) => {
  watchers.add(watch)
  return () => {
    watchers.delete(watch)
  }
}

/** Mounted once in the root layout. */
export function ToastHost() {
  const current = useSyncExternalStore(subscribe, () => shown)
  return (
    <Toast
      key={current?.key}
      message={current?.message ?? null}
      onUndo={current?.onUndo}
      durationMs={current?.durationMs}
      onHide={() => set(null)}
    />
  )
}
