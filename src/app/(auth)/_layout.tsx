import { Redirect, Stack, useSegments } from 'expo-router'

import { useSession } from '@/features/auth/session'
import { color } from '@/lib/theme'

const signedOutScreens = ['welcome', 'sign-up', 'sign-in']

/** Signed in → "/" (the tabs pick onboarding, the switcher or Inicio); signed out → welcome. */
export default function AuthLayout() {
  const { state } = useSession()
  const screen = useSegments()[1] ?? 'welcome'
  const signedIn = state.status === 'signedIn'

  if (signedIn && signedOutScreens.includes(screen)) return <Redirect href="/" />
  if (!signedIn && !signedOutScreens.includes(screen)) return <Redirect href="/welcome" />

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgSoft } }}
    />
  )
}
