import { Mic, Square } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { color, iconSize, iconStroke } from '@/lib/theme'

type Props = {
  visible: boolean
  listening: boolean
  transcript: string
  onToggleListening: () => void
  onUse: () => void
  onClose: () => void
}

/** Shell only: M8 connects on-device speech recognition to listening/transcript. */
export function DictationSheet({
  visible,
  listening,
  transcript,
  onToggleListening,
  onUse,
  onClose,
}: Props) {
  return (
    <Sheet visible={visible} title="Dictar" onClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={listening ? 'Detener dictado' : 'Empezar a dictar'}
        accessibilityState={{ busy: listening }}
        onPress={withTap(onToggleListening)}
        className={cx(
          'size-tile items-center justify-center self-center rounded-full active:opacity-80',
          listening ? 'bg-danger' : 'bg-accent',
        )}
      >
        {listening ? (
          <Square color={color.onDanger} size={iconSize.field} strokeWidth={iconStroke.field} />
        ) : (
          <Mic color={color.onAccent} size={iconSize.field} strokeWidth={iconStroke.field} />
        )}
      </Pressable>
      <Text className="text-center font-sans-semibold text-body text-text">
        {listening ? 'Escuchando… habla cerca del teléfono' : 'Toca el micrófono y habla'}
      </Text>
      <View className="min-h-24 rounded-card border border-border bg-bg-soft p-4">
        <Text className={cx('font-sans text-body', transcript ? 'text-text' : 'text-muted')}>
          {transcript || 'Aquí aparece lo que dices.'}
        </Text>
      </View>
      <View className="flex-row gap-3">
        <Button className="flex-1" variant="secondary" label="Cancelar" onPress={onClose} />
        <Button className="flex-1" label="Usar" onPress={onUse} disabled={!transcript} />
      </View>
    </Sheet>
  )
}
