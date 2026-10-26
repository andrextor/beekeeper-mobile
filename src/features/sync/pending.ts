/** Outbox rows not yet on the server. ponytail: always 0 until M3 adds the outbox. */
export async function pendingCount(): Promise<number> {
  return 0
}
