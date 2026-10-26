/** Selected / unselected look shared by every field choice (scale, tri-state, chips). */
export const choiceBox = (selected: boolean) =>
  selected ? 'border-deep bg-accent' : 'border-border bg-surface'
