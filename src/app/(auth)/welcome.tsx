import { router } from 'expo-router'
import { Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Honeycomb } from '@/components/ui/icons'
import { Screen } from '@/components/ui/Screen'
import { Title } from '@/components/ui/Title'
import { color, iconSize } from '@/lib/theme'

export default function WelcomeScreen() {
  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center gap-4">
        <Honeycomb color={color.primary} size={iconSize.hero} />
        <Title text="Landak Apiario" />
        <Text className="font-sans text-body text-muted">
          Registra tus revisiones en el apiario, con o sin señal. Lo que guardes queda en este
          teléfono hasta que se sincronice.
        </Text>
      </View>
      <View className="gap-3 pb-4">
        <Button label="Crear cuenta" onPress={() => router.push('/sign-up')} />
        <Button
          variant="secondary"
          label="Ya tengo cuenta"
          onPress={() => router.push('/sign-in')}
        />
      </View>
    </Screen>
  )
}
