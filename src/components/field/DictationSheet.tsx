import { Mic, Pencil, Square } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TextField } from '@/components/ui/TextField'
import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { color, iconSize, iconStroke } from '@/lib/theme'

type Props = {
  visible: boolean
  listening: boolean
  /** Settled words (deep) and the words still being recognized (muted). */
  finalText: string
  interim: string
  /** Hand correction after stopping ("Corregir texto"); `null` while not correcting. */
  editing: string | null
  onEdit: (text: string | null) => void
  onToggleListening: () => void
  onUse: () => void
  onClose: () => void
  /** Banners above the microphone: offline pack, permission, errors. */
  children?: ReactNode
}

/** 96-dp microphone that turns into Detener; the text can be corrected by hand once stopped. */
export function DictationSheet({
  visible,
  listening,
  finalText,
  interim,
  editing,
  onEdit,
  onToggleListening,
  onUse,
  onClose,
  children,
}: Props) {
  const text = [finalText, interim].filter(Boolean).join(' ')
  return (
    <Sheet visible={visible} title="Dictar" onClose={onClose}>
      {children}
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
        {listening ? 'Escuchando… toca para detener' : 'Toca el micrófono y habla'}
      </Text>
      {editing !== null ? (
        <TextField
          label="Corregir texto"
          value={editing}
          onChangeText={onEdit}
          multiline
          autoFocus
        />
      ) : (
        <View className="min-h-24 rounded-card border border-border bg-bg-soft p-4">
          {text ? (
            <Text className="font-sans text-field-label">
              <Text className="text-text">{finalText}</Text>
              {interim ? <Text className="text-muted">{` ${interim}`}</Text> : null}
            </Text>
          ) : (
            <Text className="font-sans text-body text-muted">Aquí aparece lo que dices.</Text>
          )}
        </View>
      )}
      {!listening && finalText && editing === null ? (
        <Button
          variant="secondary"
          icon={Pencil}
          label="Corregir texto"
          onPress={() => onEdit(finalText)}
        />
      ) : null}
      <View className="flex-row gap-3">
        <Button className="flex-1" variant="secondary" label="Cancelar" onPress={onClose} />
        <Button
          className="min-h-tile flex-1"
          label="Listo"
          onPress={onUse}
          disabled={listening || !(editing ?? finalText).trim()}
        />
      </View>
    </Sheet>
  )
}
