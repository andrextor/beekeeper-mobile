import {
  CloudCheck,
  CloudUpload,
  type LucideIcon,
  Smartphone,
  TriangleAlert,
} from 'lucide-react-native'
import { Pressable, Text } from 'react-native'

import { cx } from '@/lib/cx'
import { color } from '@/lib/theme'

export type SyncState = 'saved' | 'pending' | 'synced' | 'attention'

const look: Record<SyncState, { icon: LucideIcon; box: string; text: string; ink: string }> = {
  saved: { icon: Smartphone, box: 'bg-accent', text: 'text-on-accent', ink: color.onAccent },
  pending: {
    icon: CloudUpload,
    box: 'border-2 border-accent bg-surface',
    text: 'text-text',
    ink: color.text,
  },
  synced: { icon: CloudCheck, box: 'bg-transparent', text: 'text-primary', ink: color.primary },
  attention: { icon: TriangleAlert, box: 'bg-danger', text: 'text-on-danger', ink: color.onDanger },
}

export function syncLabel(state: SyncState, count?: number): string {
  const n = count === undefined ? '' : ` (${count})`
  switch (state) {
    case 'saved':
      return 'Guardado en este dispositivo'
    case 'pending':
      return `Pendiente de sincronizar${n}`
    case 'synced':
      return 'Sincronizado'
    case 'attention':
      return `Requiere atención${n}`
  }
}

/** DESIGN.md sync vocabulary, shared with the admin. Tapping "attention" opens the reason. */
export function SyncChip({
  state,
  count,
  onPress,
}: {
  state: SyncState
  count?: number
  onPress?: () => void
}) {
  const { icon: Icon, box, text, ink } = look[state]
  const label = syncLabel(state, count)
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      className={cx(
        'flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5',
        onPress ? 'min-h-target px-4' : 'min-h-10',
        box,
      )}
    >
      <Icon color={ink} size={18} strokeWidth={2.25} />
      <Text className={cx('font-sans-semibold text-caption', text)}>{label}</Text>
    </Pressable>
  )
}
