import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
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
    if (busy) return
    setPendingOfOther(0)
    setBusy(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    // On success the button stays busy until the session redirect, so it cannot be sent twice.
    if (!signInError) return
    setBusy(false)
    setError(
      isNetworkError(signInError)
        ? 'Necesitas conexión para entrar la primera vez.'
        : messageFor(signInError),
    )
  }

  // Another account on this phone erases what the previous one left unsynced: say so first.
  const submit = async () => {
    if (busy || !email.trim() || !password) return
    const pending = await pendingCount()
    const other = lastEmail && lastEmail.toLowerCase() !== email.trim().toLowerCase()
    if (other && pending > 0) return setPendingOfOther(pending)
    await signIn()
  }

  return (
    <Screen>
      <BackButton />
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
        placeholder="nombre@correo.com"
      />
      <PasswordField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        onSubmitEditing={submit}
      />
      <FormError message={error} />
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
