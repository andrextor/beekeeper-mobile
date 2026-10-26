import { router } from 'expo-router'
import { useState } from 'react'
import { Text } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { PasswordField } from '@/features/auth/PasswordField'
import { errorCode, messageFor } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

const minPassword = 8

export default function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exists, setExists] = useState(false)
  const [busy, setBusy] = useState(false)

  const repeatError = repeat && repeat !== password ? 'Las contraseñas no coinciden.' : undefined

  const submit = async () => {
    if (password.length < minPassword)
      return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== repeat) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    setError(null)
    setExists(false)
    const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
    setBusy(false)
    if (!signUpError) return
    const code = errorCode(signUpError)
    setExists(code === 'user_already_exists' || code === 'email_exists')
    setError(messageFor(signUpError))
  }

  return (
    <Screen>
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Crear cuenta
      </Text>
      <TextField
        label="Tu correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />
      <PasswordField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        hint="Mínimo 8 caracteres"
      />
      <PasswordField
        label="Repite la contraseña"
        value={repeat}
        onChangeText={setRepeat}
        autoComplete="new-password"
        error={repeatError}
        onSubmitEditing={submit}
      />
      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-body text-danger">
          {error}
        </Text>
      ) : null}
      {exists ? (
        <Button
          variant="secondary"
          label="Ingresar con este correo"
          onPress={() => router.replace({ pathname: '/sign-in', params: { email: email.trim() } })}
        />
      ) : null}
      <Button
        label="Crear cuenta"
        loading={busy}
        disabled={!email.trim() || !password || !repeat}
        onPress={submit}
      />
    </Screen>
  )
}
