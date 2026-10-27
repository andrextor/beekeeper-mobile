import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { HoneycombPattern } from '@/components/ui/HoneycombPattern'
import { Honeycomb } from '@/components/ui/icons'
import { useLightStatusBar } from '@/components/ui/Screen'
import { color, shadow } from '@/lib/theme'

/** Most people arrive with an account (made by the admin, or to use an invite): sign-in leads. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  useLightStatusBar()
  return (
    <View className="flex-1 bg-deep" style={{ paddingTop: insets.top }}>
      <HoneycombPattern />
      <View className="flex-1 justify-center gap-5 px-7">
        <View
          className="size-[88px] items-center justify-center rounded-[28px] bg-accent"
          style={shadow.raised}
        >
          <Honeycomb color={color.onAccent} size={52} />
        </View>
        <Text
          accessibilityRole="header"
          className="font-display text-[38px] leading-[44px] text-white"
        >
          Landak Apiario
        </Text>
        <Text className="font-sans text-body text-mist">
          Registra tus revisiones en el apiario, con o sin señal. Lo que guardes queda en este
          teléfono hasta que se sincronice.
        </Text>
      </View>
      <View
        className="gap-2 rounded-t-sheet bg-bg-soft px-5 pt-7"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Button label="Iniciar sesión" onPress={() => router.push('/sign-in')} />
        <View className="flex-row items-center justify-center">
          <Text className="font-sans text-body text-muted">¿No tienes cuenta?</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/sign-up')}
            className="min-h-target justify-center px-2 active:opacity-70"
          >
            <Text className="font-sans-bold text-body text-on-primary-soft underline">
              Crear cuenta
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
