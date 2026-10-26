import { Stack } from 'expo-router'

import { useSession } from '@/features/auth/session'
import { color } from '@/lib/theme'

export default function AuthLayout() {
  const { state } = useSession()
  const signedIn = state.status === 'signedIn'
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgSoft } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="join" />
      </Stack.Protected>
    </Stack>
  )
}
