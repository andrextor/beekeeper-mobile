import { router } from 'expo-router'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { formatInviteCode, isCompleteInviteCode } from '@/features/auth/invite-code'
import { acceptInvite, includesFinca } from '@/features/auth/organizations'
import { useSession } from '@/features/auth/session'
import { messageFor } from '@/lib/errors'
import { color } from '@/lib/theme'

export default function JoinScreen() {
  const { refreshMemberships, setActiveOrganization } = useSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // A code works once: after accept_invite succeeds, a retry only reloads the fincas.
  const [joinedId, setJoinedId] = useState<string | null>(null)
  const canSubmit = !busy && (joinedId !== null || isCompleteInviteCode(code))

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    let organizationId = joinedId
    try {
      organizationId ??= await acceptInvite(code)
      setJoinedId(organizationId)
      includesFinca(await refreshMemberships(true), organizationId)
      await setActiveOrganization(organizationId)
      router.replace('/')
    } catch (e) {
      setError(
        organizationId
          ? 'Ya eres parte de la finca, pero no pudimos cargarla. Revisa tu conexión y toca Reintentar.'
          : messageFor(e),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Tengo un código
      </Text>
      <Text className="font-sans text-body text-muted">
        Escribe o pega el código de 8 caracteres que te envió el propietario de la finca.
      </Text>
      <View className="rounded-card border-2 border-border bg-surface px-4">
        <TextInput
          accessibilityLabel="Código de invitación"
          value={code}
          onChangeText={(text) => setCode(formatInviteCode(text))}
          placeholder="XXXX-XXXX"
          placeholderTextColor={color.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="go"
          editable={joinedId === null}
          onSubmitEditing={submit}
          className="min-h-field text-center font-mono text-code tracking-widest text-text"
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="font-sans-semibold text-body text-danger">
          {error}
        </Text>
      ) : null}
      <Button
        label={joinedId ? 'Reintentar' : 'Unirme a la finca'}
        loading={busy}
        disabled={!canSubmit && !busy}
        onPress={submit}
      />
    </Screen>
  )
}
