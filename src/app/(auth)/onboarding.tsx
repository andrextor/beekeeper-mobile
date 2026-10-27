import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { KeyRound, LogOut, type LucideIcon } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Text, View } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { IconTile } from '@/components/ui/IconTile'
import { Honeycomb } from '@/components/ui/icons'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { Title } from '@/components/ui/Title'
import { createOrganization, includesFinca, updateDisplayName } from '@/features/auth/organizations'
import { signOut, useSession } from '@/features/auth/session'
import { isNetworkError, messageFor } from '@/lib/errors'
import { uuid } from '@/lib/ids'

export default function OnboardingScreen() {
  const { state, refreshMemberships, setActiveOrganization } = useSession()
  const { add } = useLocalSearchParams<{ add?: string }>()
  const [creating, setCreating] = useState(add === '1')
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  if (state.status !== 'signedIn') return null
  // Someone who already has a finca lands here only to add another one (never mid-creation).
  if (state.memberships.length > 0 && !creating) {
    return <Redirect href={state.activeOrganizationId ? '/(tabs)' : '/organizations'} />
  }

  if (creating) {
    return (
      <CreateFinca
        onBack={add === '1' ? undefined : () => setCreating(false)}
        userId={state.session.user.id}
        email={state.session.user.email ?? ''}
        onCreated={async (id) => {
          includesFinca(await refreshMemberships(true), id)
          await setActiveOrganization(id)
          router.dismissTo('/apiaries')
        }}
      />
    )
  }

  return (
    <Screen>
      <Title text="Empecemos" />
      <Choice
        icon={Honeycomb}
        title="Crear mi finca"
        body="Soy el apicultor: registro mis apiarios y colmenas."
        onPress={() => setCreating(true)}
      />
      <Choice
        icon={KeyRound}
        title="Tengo un código"
        body="Alguien me invitó a su finca y me envió un código."
        onPress={() => router.push('/join')}
      />
      {/* No finca yet means nothing local to lose: signing out needs no confirmation. */}
      <View className="mt-4 gap-3">
        <Text className="font-sans text-body text-muted">{`Entraste como ${state.session.user.email ?? ''}`}</Text>
        <FormError message={signOutError} />
        <Button
          variant="secondary"
          icon={LogOut}
          label="Cerrar sesión"
          loading={signingOut}
          onPress={async () => {
            setSigningOut(true)
            setSignOutError(null)
            try {
              await signOut()
            } catch (e) {
              setSignOutError(
                isNetworkError(e) ? 'Necesitas conexión para cerrar sesión.' : messageFor(e),
              )
              setSigningOut(false)
            }
          }}
        />
      </View>
    </Screen>
  )
}

function Choice({
  icon,
  title,
  body,
  onPress,
}: {
  icon: LucideIcon
  title: string
  body: string
  onPress: () => void
}) {
  return (
    <Card onPress={onPress} className="min-h-tile flex-row items-center gap-4">
      <IconTile icon={icon} tone="accent" />
      <View className="flex-1 gap-1">
        <Text className="font-display text-section text-text">{title}</Text>
        <Text className="font-sans text-body text-muted">{body}</Text>
      </View>
    </Card>
  )
}

function CreateFinca({
  onBack,
  userId,
  email,
  onCreated,
}: {
  onBack?: () => void
  userId: string
  email: string
  onCreated: (id: string) => Promise<void>
}) {
  const id = useRef(uuid())
  const [name, setName] = useState(`Finca de ${email.split('@')[0] ?? ''}`)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const trimmed = name.trim()
  const submit = async () => {
    if (busy || !trimmed) return
    setBusy(true)
    setError(null)
    try {
      const organizationId = await createOrganization(id, trimmed)
      // Optional: a failure here must not block the finca, which already exists.
      if (displayName.trim()) await updateDisplayName(userId, displayName.trim()).catch(() => {})
      await onCreated(organizationId)
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <BackButton onPress={onBack} />
      <Title text="Crea tu finca" />
      <Text className="font-sans text-body text-muted">
        Es el nombre de tu explotación apícola. Podrás invitar revisores después.
      </Text>
      <TextField label="Nombre" value={name} onChangeText={setName} maxLength={120} />
      <TextField
        label="Tu nombre (opcional)"
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="name"
        maxLength={80}
      />
      <FormError message={error} />
      <Button label="Crear mi finca" loading={busy} disabled={!trimmed} onPress={submit} />
    </Screen>
  )
}
