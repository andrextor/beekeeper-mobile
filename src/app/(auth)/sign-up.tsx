import { router } from 'expo-router'
import { useState } from 'react'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { PasswordField } from '@/features/auth/PasswordField'
import { errorCode, messageFor, minPasswordLength, passwordTooShort } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

export default function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exists, setExists] = useState(false)
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(false)

  // Checked once the field is left, cleared as soon as the value is long enough.
  const shortError =
    left && password && password.length < minPasswordLength ? passwordTooShort : undefined
  const repeatError = repeat && repeat !== password ? 'Las contraseñas no coinciden.' : undefined

  const submit = async () => {
    if (busy || !email.trim() || !password || !repeat) return
    if (password.length < minPasswordLength) return setError(passwordTooShort)
    if (password !== repeat) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    setError(null)
    setExists(false)
    const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
    // On success the button stays busy until the session redirect, so it cannot be sent twice.
    if (!signUpError) return
    setBusy(false)
    const code = errorCode(signUpError)
    setExists(code === 'user_already_exists' || code === 'email_exists')
    setError(messageFor(signUpError))
  }

  return (
    <Screen hero={{ title: 'Crear cuenta' }}>
      <BackButton />
      <TextField
        label="Tu correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        placeholder="nombre@correo.com"
      />
      <PasswordField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        hint={`Mínimo ${minPasswordLength} caracteres`}
        error={shortError}
        onBlur={() => setLeft(true)}
      />
      <PasswordField
        label="Repite la contraseña"
        value={repeat}
        onChangeText={setRepeat}
        autoComplete="new-password"
        error={repeatError}
        onSubmitEditing={submit}
      />
      <FormError message={error} />
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
