import { Save, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TextField } from '@/components/ui/TextField'
import { noteText } from './schema'

type Props = {
  /** Sheet title ("Nota 1", "Notas de la revisión"). */
  title: string
  visible: boolean
  initial: string
  /** Note events allow 2000 characters, the inspection's notes 4000 (B4). */
  max: number
  onSave: (text: string) => void
  onDelete?: () => void
  onClose: () => void
}

/** The only place with a keyboard in field mode (M8 adds "Dictar" here). */
export function NoteSheet({ title, visible, initial, max, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setText(initial)
      setError(null)
    }
  }, [visible, initial])

  const save = () => {
    const checked = noteText(max).safeParse(text)
    if (!checked.success) return setError(checked.error.issues[0]?.message ?? 'Escribe la nota.')
    onSave(checked.data)
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
      <Button icon={Save} label="Guardar nota" className="min-h-field" onPress={save} />
      {onDelete ? (
        <Button variant="danger" icon={Trash2} label="Borrar nota" onPress={onDelete} />
      ) : null}
    </Sheet>
  )
}
