import '../../global.css'

import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { SessionProvider, useSession } from '@/features/auth/session'
import { color } from '@/lib/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })
  const fontsReady = loaded || error !== null

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <RootNavigator fontsReady={fontsReady} />
      </SessionProvider>
    </SafeAreaProvider>
  )
}

/**
 * Guards mirror the auth state: signed out → (auth) welcome; signed in without a finca → onboarding;
 * several fincas and none chosen → the switcher; otherwise the tabs.
 */
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { state } = useSession()
  const ready = fontsReady && state.status !== 'loading'
  const signedIn = state.status === 'signedIn'
  const hasFincas = signedIn && state.memberships.length > 0
  const inFinca = signedIn && state.activeOrganizationId !== null

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgSoft } }}>
      <Stack.Protected guard={inFinca}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={hasFincas}>
        <Stack.Screen name="organizations" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="_design" />
    </Stack>
  )
}
