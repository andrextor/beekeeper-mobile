type Wipe = () => Promise<void>

const wipes: Wipe[] = []

/** Each local store (memberships, SQLite in M3, photo files in M9) registers how to erase itself. */
export function registerWipe(wipe: Wipe): void {
  wipes.push(wipe)
}

export async function wipeLocalData(): Promise<void> {
  for (const wipe of wipes) await wipe()
}
