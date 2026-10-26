/** Mites per 100 bees, one decimal: shown live, never stored (it is derivable). */
export function varroaLoadPercent(count: number | null, sampleSize: number | null): number | null {
  if (count === null || sampleSize === null || sampleSize <= 0) return null
  return Math.round((count / sampleSize) * 1000) / 10
}
