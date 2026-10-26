import { router } from 'expo-router'
import { Check, Hexagon, KeyRound, Plus } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListItem } from '@/components/ui/ListItem'
import { Screen } from '@/components/ui/Screen'
import { useSession } from '@/features/auth/session'
import { roleLabels } from '@/lib/labels'
import { color } from '@/lib/theme'

export default function OrganizationsScreen() {
  const { state, setActiveOrganization } = useSession()
  if (state.status !== 'signedIn') return null

  const choose = async (id: string) => {
    await setActiveOrganization(id)
    router.replace('/')
  }

  return (
    <Screen>
      <Text accessibilityRole="header" className="font-display text-title text-text">
        Tus fincas
      </Text>
      <Card className="overflow-hidden p-0">
        {state.memberships.map((m) => (
          <ListItem
            key={m.organization_id}
            icon={Hexagon}
            title={m.organization_name}
            trailing={
              <View className="flex-row items-center gap-2">
                <Badge
                  label={roleLabels[m.role]}
                  tone={m.role === 'owner' ? 'primary' : 'neutral'}
                />
                {m.organization_id === state.activeOrganizationId ? (
                  <Check accessibilityLabel="Finca actual" color={color.primary} size={24} />
                ) : null}
              </View>
            }
            onPress={() => choose(m.organization_id)}
          />
        ))}
      </Card>
      <Button
        variant="secondary"
        icon={KeyRound}
        label="Unirme con un código"
        onPress={() => router.push('/join')}
      />
      <Button
        variant="secondary"
        icon={Plus}
        label="Crear otra finca"
        onPress={() => router.push({ pathname: '/onboarding', params: { add: '1' } })}
      />
      {router.canGoBack() ? (
        <Button variant="secondary" label="Cerrar" onPress={() => router.back()} />
      ) : null}
    </Screen>
  )
}
