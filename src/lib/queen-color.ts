import type { queenColorLabels } from '@/lib/labels'

export type QueenColor = keyof typeof queenColorLabels

// International marking colours by the year's last digit: 1/6 white, 2/7 yellow, 3/8 red, 4/9 green, 5/0 blue.
const byYear: readonly QueenColor[] = ['blue', 'white', 'yellow', 'red', 'green']

export function suggestQueenColor(year: number): QueenColor {
  return byYear[year % 5] ?? 'blue'
}
