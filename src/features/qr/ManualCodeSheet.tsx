import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TextField } from '@/components/ui/TextField'
import { parseQrPayload } from '@/lib/qr-code'

type Props = { visible: boolean; onClose: () => void; onCode: (code: string) => void }

/** For a dirty or wet label: the 10 characters under the QR; O/0 and I/1/L are forgiven. */
export function ManualCodeSheet({ visible, onClose, onCode }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const code = parseQrPayload(text)
    if (!code) return setError('Revisa el código: son 10 letras y números, como V1C01-A7K2M.')
    setText('')
    setError(null)
    onCode(code)
  }

  return (
    <Sheet visible={visible} title="Escribir código" onClose={onClose}>
      <TextField
        label="Código de la etiqueta"
        value={text}
        onChangeText={(value) => {
          setText(value)
          setError(null)
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={14}
        placeholder="ABCDE-FGHIJ"
        onSubmitEditing={submit}
        error={error ?? undefined}
      />
      <Button label="Abrir colmena" disabled={!text.trim()} onPress={submit} />
    </Sheet>
  )
}
