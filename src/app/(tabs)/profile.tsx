import { router } from 'expo-router'
import { Palette, UserRound } from 'lucide-react-native'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Screen } from '@/components/ui/Screen'

export default function ProfileScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState icon={UserRound} title="Perfil" body="Tu cuenta, tu finca y cerrar sesión." />
      {__DEV__ && (
        <Button
          variant="secondary"
          icon={Palette}
          label="Galería de componentes"
          onPress={() => router.push('/_design')}
        />
      )}
    </Screen>
  )
}
