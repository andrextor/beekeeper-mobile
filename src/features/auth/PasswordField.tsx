import { Eye, EyeOff } from 'lucide-react-native'
import { useState } from 'react'

import { IconButton } from '@/components/ui/IconButton'
import { TextField } from '@/components/ui/TextField'

type Props = {
  label: string
  value: string
  onChangeText: (value: string) => void
  autoComplete: 'new-password' | 'current-password'
  hint?: string
  error?: string
  onSubmitEditing?: () => void
  onBlur?: () => void
}

export function PasswordField({ autoComplete, ...props }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      autoComplete={autoComplete}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={autoComplete === 'new-password' ? 'newPassword' : 'password'}
      trailing={
        <IconButton
          icon={visible ? EyeOff : Eye}
          label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setVisible((v) => !v)}
        />
      }
    />
  )
}
