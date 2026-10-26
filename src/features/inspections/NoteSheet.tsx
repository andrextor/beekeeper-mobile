import { Mic, Save, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TextField } from '@/components/ui/TextField'
import { DictationFlow } from '@/features/voice/DictationFlow'
import { noteText } from './schema'

type Props = {
  /** Sheet title ("Nota 1", "Notas de la revisión"). */
  title: string
  visible: boolean
  initial: string
  /** Note events allow 2000 characters, the inspection's notes 4000 (B4). */
  max: number
  /** `voice` when any of the text was dictated. */
  onSave: (text: string, source: 'text' | 'voice') => void
  onDelete?: () => void
  onClose: () => void
}

/** The only place with a keyboard in field mode (M8 adds "Dictar" here). */
export function NoteSheet({ title, visible, initial, max, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [dictating, setDictating] = useState(false)
  const [dictated, setDictated] = useState(false)

  useEffect(() => {
    if (visible) {
      setText(initial)
      setError(null)
      setDictated(false)
    }
  }, [visible, initial])

  const save = () => {
    const checked = noteText(max).safeParse(text)
    if (!checked.success) return setError(checked.error.issues[0]?.message ?? 'Escribe la nota.')
    onSave(checked.data, dictated ? 'voice' : 'text')
  }

  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <TextField
        label="Texto"
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        maxLength={max}
        error={error ?? undefined}
      />
      <Button
        variant="accent"
        icon={Mic}
        label="Dictar"
        className="min-h-tile"
        onPress={() => setDictating(true)}
      />
      <Button icon={Save} label="Guardar nota" className="min-h-field" onPress={save} />
      {onDelete ? (
        <Button variant="danger" icon={Trash2} label="Borrar nota" onPress={onDelete} />
      ) : null}
      <DictationFlow
        visible={dictating}
        room={max - text.length - 1}
        onClose={() => setDictating(false)}
        onDone={(spoken) => {
          setDictating(false)
          setDictated(true)
          setText((current) => [current.trim(), spoken].filter(Boolean).join(' '))
        }}
      />
    </Sheet>
  )
}
