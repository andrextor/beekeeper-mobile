import { Redirect, Stack, useSegments } from 'expo-router'

import { useSession } from '@/features/auth/session'
import { color } from '@/lib/theme'

const signedOutScreens = ['welcome', 'sign-up', 'sign-in']

// Without it the group falls back to its alphabetically first screen, "join".
export const unstable_settings = { initialRouteName: 'welcome' }

/** Signed in → the tabs (they pick onboarding, the switcher or Inicio); signed out → welcome. */
export default function AuthLayout() {
  const { state } = useSession()
  const screen = useSegments()[1] ?? 'welcome'
  const signedIn = state.status === 'signedIn'

  if (signedIn && signedOutScreens.includes(screen)) return <Redirect href="/(tabs)" />
  if (!signedIn && !signedOutScreens.includes(screen)) return <Redirect href="/(auth)/welcome" />

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgSoft } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="join" />
    </Stack>
  )
}
