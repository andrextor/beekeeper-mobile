import { router } from 'expo-router'
import { KeyRound, Plus } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Honeycomb } from '@/components/ui/icons'
import { ListItem } from '@/components/ui/ListItem'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { Screen } from '@/components/ui/Screen'
import { Title } from '@/components/ui/Title'
import { useSession } from '@/features/auth/session'

export default function OrganizationsScreen() {
  const { state, setActiveOrganization } = useSession()
  if (state.status !== 'signedIn') return null

  const choose = async (id: string) => {
    await setActiveOrganization(id)
    router.dismissTo('/(tabs)')
  }

  return (
    <Screen>
      <Title text="Tus fincas" />
      <Card className="overflow-hidden p-0">
        {state.memberships.map((m) => (
          <ListItem
            key={m.organization_id}
            icon={Honeycomb}
            title={m.organization_name}
            subtitle={m.organization_id === state.activeOrganizationId ? 'Finca actual' : undefined}
            trailing={<RoleBadge role={m.role} />}
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
