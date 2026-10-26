import { Redirect, router, useLocalSearchParams } from 'expo-router'

import { BackButton } from '@/components/ui/BackButton'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { saveRow } from '@/db/write'
import { useApiaryNames } from '@/features/apiaries/queries'
import { useRole, useSession } from '@/features/auth/session'
import { HiveForm } from '@/features/hives/HiveForm'
import { emptyHive, type HiveFields } from '@/features/hives/schema'
import { uuid } from '@/lib/ids'
import { newQrCode } from '@/lib/qr-code'

export default function NewHiveScreen() {
  const { apiaryId } = useLocalSearchParams<{ apiaryId?: string }>()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const organizationId = state.status === 'signedIn' ? (state.activeOrganizationId ?? '') : ''
  const apiaries = useApiaryNames(organizationId)

  if (!owner || state.status !== 'signedIn') return <Redirect href="/apiaries" />
  const userId = state.session.user.id

  const save = async (fields: HiveFields) => {
    const id = uuid()
    const now = new Date().toISOString()
    await saveRow(await getDb(), 'hives', {
      ...fields,
      id,
      organization_id: organizationId,
      qr_code: newQrCode(),
      created_by: userId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    })
    showToast('Guardado en este dispositivo')
    router.replace({ pathname: '/hive/[id]', params: { id } })
  }

  return (
    <HiveForm
      title="Nueva colmena"
      header={<BackButton />}
      initial={emptyHive(apiaryId ?? '', '')}
      apiaries={apiaries}
      onSave={save}
    />
  )
}
