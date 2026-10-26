const plain: Readonly<Record<string, string>> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
  ñ: 'n',
}

/** Lowercase without Spanish accents, for search ("Peña" matches "pena"). Hermes may lack `normalize`. */
export function fold(text: string): string {
  return text.toLowerCase().replace(/[áéíóúüñ]/g, (c) => plain[c] ?? c)
}

/** Names unique "ignoring case" (B3): is `name` already among `others`? */
export function nameTaken(name: string, others: readonly string[]): boolean {
  const wanted = fold(name.trim())
  return others.some((other) => fold(other.trim()) === wanted)
}
