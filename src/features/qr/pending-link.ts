// A `landak://h/<code>` that arrived signed out waits here until the tabs mount after sign-in.
// ponytail: memory only; if the app is killed meanwhile the person scans again.
let waiting: string | null = null

export const keepLinkForLater = (code: string): void => {
  waiting = code
}

export function takeWaitingLink(): string | null {
  const code = waiting
  waiting = null
  return code
}
