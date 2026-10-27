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
import { useCallback, useEffect, useState } from 'react'
import { LogBox } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { DbError } from '@/components/ui/DbError'
import { ToastHost } from '@/components/ui/ToastHost'
import { getDb, retryDb, shareDatabase } from '@/db/database'
import { SessionProvider, useSession } from '@/features/auth/session'
import { color } from '@/lib/theme'

SplashScreen.preventAutoHideAsync()

// Raised inside expo-router, not by app code; pinned to the router's own root screen, so the
// same mistake in an app screen still shows. (ImageBackground's notice is dropped in index.js.)
LogBox.ignoreLogs(["navigation.isFocused() was called while rendering the screen '__root'"])

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
      <ToastHost />
    </SafeAreaProvider>
  )
}

/** The tabs layout redirects to the right entry screen; (auth) guards its own screens. */
function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { state } = useSession()
  const [db, setDb] = useState<'opening' | 'ready' | 'failed'>('opening')
  const ready = fontsReady && state.status !== 'loading' && db !== 'opening'
  const hasFincas = state.status === 'signedIn' && state.memberships.length > 0

  // Opened before any screen mounts: a migration that fails after an update stops the app here.
  const openDb = useCallback(() => {
    setDb('opening')
    getDb().then(
      () => setDb('ready'),
      () => setDb('failed'),
    )
  }, [])
  useEffect(openDb, [openDb])

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null
  if (db === 'failed')
    return (
      <DbError
        onShare={() => void shareDatabase().catch(() => {})}
        onRetry={() => {
          retryDb()
          openDb()
        }}
      />
    )

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgSoft } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Protected guard={hasFincas}>
        <Stack.Screen name="organizations" options={{ presentation: 'modal' }} />
        <Stack.Screen name="apiary/new" />
        <Stack.Screen name="apiary/[id]/index" />
        <Stack.Screen name="apiary/[id]/edit" />
        <Stack.Screen name="hive/new" />
        <Stack.Screen name="hive/[id]/index" />
        <Stack.Screen name="hive/[id]/edit" />
        <Stack.Screen name="hive/[id]/label" />
        <Stack.Screen name="hive/[id]/relabel" />
        <Stack.Screen name="hive/[id]/inspect" />
        <Stack.Screen name="hive/[id]/camera" />
        <Stack.Screen name="hive/[id]/event/new" />
        <Stack.Screen name="hive/[id]/event/[eventId]" />
        <Stack.Screen name="hive/[id]/photos" />
        <Stack.Screen name="photo/[id]" />
        <Stack.Screen name="inspection/[id]" />
        <Stack.Screen name="qr/assign" />
        <Stack.Screen name="members" />
        <Stack.Screen name="invite" />
      </Stack.Protected>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="h/[code]" />
      <Stack.Screen name="_design" />
    </Stack>
  )
}
