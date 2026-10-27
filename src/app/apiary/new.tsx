import { Redirect, router } from 'expo-router'
import { BackButton } from '@/components/ui/BackButton'
import { Screen } from '@/components/ui/Screen'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { saveRow } from '@/db/write'
import { ApiaryForm } from '@/features/apiaries/ApiaryForm'
import { useApiaryNames } from '@/features/apiaries/queries'
import type { ApiaryFields } from '@/features/apiaries/schema'
import { useRole, useSession } from '@/features/auth/session'
import { uuid } from '@/lib/ids'

export default function NewApiaryScreen() {
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const organizationId = state.status === 'signedIn' ? (state.activeOrganizationId ?? '') : ''
  const names = useApiaryNames(organizationId)

  if (!owner || state.status !== 'signedIn') return <Redirect href="/apiaries" />
  const userId = state.session.user.id

  const save = async (fields: ApiaryFields) => {
    const id = uuid()
    const now = new Date().toISOString()
    await saveRow(await getDb(), 'apiaries', {
      ...fields,
      id,
      organization_id: organizationId,
      created_by: userId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    })
    showToast('Guardado en este dispositivo')
    router.replace({ pathname: '/apiary/[id]', params: { id } })
  }

  return (
    <Screen hero={{ title: 'Nuevo apiario' }}>
      <BackButton />
      <ApiaryForm otherNames={names.map((n) => n.name)} onSave={save} />
    </Screen>
  )
}
