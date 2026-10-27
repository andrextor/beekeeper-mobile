import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { KeyRound, LogOut } from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import { BackHandler, Pressable, Text, View } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Honeycomb } from '@/components/ui/icons'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { createOrganization, includesFinca, updateDisplayName } from '@/features/auth/organizations'
import { SignOutSheet } from '@/features/auth/SignOutSheet'
import { useSession } from '@/features/auth/session'
import { pendingCount } from '@/features/sync/pending'
import { messageFor } from '@/lib/errors'
import { uuid } from '@/lib/ids'
import { color, iconSize } from '@/lib/theme'

export default function OnboardingScreen() {
  const { state, refreshMemberships, setActiveOrganization } = useSession()
  const { add } = useLocalSearchParams<{ add?: string }>()
  const [creating, setCreating] = useState(add === '1')
  const [signOutPending, setSignOutPending] = useState<number | null>(null)
  const choosing = state.status === 'signedIn' && state.memberships.length === 0 && !creating

  // Nothing is behind Empecemos for someone without a finca: the anchored welcome would only
  // redirect back here, so the system back button leaves the app instead.
  useFocusEffect(
    useCallback(() => {
      if (!choosing) return
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp()
        return true
      })
      return () => sub.remove()
    }, [choosing]),
  )

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
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Empecemos
      </Text>
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
      <View className="mt-4 gap-3">
        {state.session.user.email ? (
          <Text className="font-sans text-body text-muted">
            {`Entraste como ${state.session.user.email}`}
          </Text>
        ) : null}
        {/* Unsent rows can outlive a lost finca: the sheet still counts them before erasing. */}
        <Button
          variant="secondary"
          icon={LogOut}
          label="Cerrar sesión"
          onPress={async () => setSignOutPending(await pendingCount())}
        />
      </View>
      <SignOutSheet pending={signOutPending} onClose={() => setSignOutPending(null)} />
    </Screen>
  )
}

function Choice({
  icon: Icon,
  title,
  body,
  onPress,
}: {
  icon: typeof Honeycomb
  title: string
  body: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-tile flex-row items-center gap-4 rounded-card border-2 border-border bg-surface p-4 active:opacity-80"
    >
      <View className="size-target items-center justify-center rounded-full bg-accent">
        <Icon color={color.onAccent} size={iconSize.standard} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-display text-section text-text">{title}</Text>
        <Text className="font-sans text-body text-muted">{body}</Text>
      </View>
    </Pressable>
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
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Crea tu finca
      </Text>
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
