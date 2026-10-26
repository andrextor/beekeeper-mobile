import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import { TextField } from '@/components/ui/TextField'
import { PasswordField } from '@/features/auth/PasswordField'
import { lastSignedInEmail } from '@/features/auth/session'
import { pendingCount } from '@/features/sync/pending'
import { isNetworkError, messageFor } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

export default function SignInScreen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = useState(params.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [lastEmail, setLastEmail] = useState<string | null>(null)
  const [pendingOfOther, setPendingOfOther] = useState(0)

  useEffect(() => {
    lastSignedInEmail().then((last) => {
      setLastEmail(last)
      if (last && !params.email) setEmail((current) => current || last)
    })
  }, [params.email])

  const signIn = async () => {
    setPendingOfOther(0)
    setBusy(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (!signInError) return
    setError(
      isNetworkError(signInError)
        ? 'Necesitas conexión para entrar la primera vez.'
        : messageFor(signInError),
    )
  }

  // Another account on this phone erases what the previous one left unsynced: say so first.
  const submit = async () => {
    const pending = await pendingCount()
    if (lastEmail && lastEmail !== email.trim() && pending > 0) return setPendingOfOther(pending)
    await signIn()
  }

  return (
    <Screen>
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Ya tengo cuenta
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
        autoComplete="current-password"
        onSubmitEditing={submit}
      />
      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-body text-danger">
          {error}
        </Text>
      ) : null}
      <Button
        label="Ingresar"
        loading={busy}
        disabled={!email.trim() || !password}
        onPress={submit}
      />
      <Button
        variant="secondary"
        label="¿Olvidaste tu contraseña?"
        onPress={() => setForgot(true)}
      />

      <Sheet visible={forgot} title="¿Olvidaste tu contraseña?" onClose={() => setForgot(false)}>
        <Text className="font-sans text-body text-text">
          Pide a tu administrador que restablezca tu contraseña.
        </Text>
        <Button label="Entendido" onPress={() => setForgot(false)} />
      </Sheet>
      <Sheet
        visible={pendingOfOther > 0}
        title="Hay registros sin sincronizar"
        onClose={() => setPendingOfOther(0)}
      >
        <Text className="font-sans text-body text-text">
          {`${lastEmail} tiene ${pendingOfOther} registros guardados en este teléfono que no se han sincronizado. Si entras con otra cuenta se perderán.`}
        </Text>
        <Button label="Volver" onPress={() => setPendingOfOther(0)} />
        <Button variant="danger" label="Entrar con otra cuenta igual" onPress={signIn} />
      </Sheet>
    </Screen>
  )
}
