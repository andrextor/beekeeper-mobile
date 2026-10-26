/** "C-13" after the highest "C-n" in the apiary, keeping its zero padding; "C-01" for the first. */
export function nextHiveName(names: readonly string[]): string {
  let highest = 0
  let width = 2
  for (const name of names) {
    const match = /^C-(\d+)$/i.exec(name.trim())
    if (!match?.[1]) continue
    highest = Math.max(highest, Number(match[1]))
    width = Math.max(width, match[1].length)
  }
  return `C-${String(highest + 1).padStart(width, '0')}`
}
