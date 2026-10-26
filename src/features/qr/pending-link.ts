// A `landak://h/<code>` that arrived before the tabs could show it waits here, briefly.
// ponytail: memory only; if the app is killed meanwhile the person scans again.
const maxAgeMs = 10 * 60_000

let waiting: { code: string; at: number } | null = null

export const keepLinkForLater = (code: string): void => {
  waiting = { code, at: Date.now() }
}

/** The waiting code, unless it is older than 10 minutes (an old scan must not pop up later). */
export function takeWaitingLink(): string | null {
  const link = waiting
  waiting = null
  return link && Date.now() - link.at < maxAgeMs ? link.code : null
}
