import { router, useLocalSearchParams } from 'expo-router'

import { Honeycomb } from '@/components/ui/icons'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { useSession } from '@/features/auth/session'
import { useHive } from '@/features/hives/queries'
import { CameraScreen } from '@/features/photos/CameraScreen'

/** Photos of a hive; with `inspectionId` they belong to that inspection (or field-mode draft). */
export default function CameraRoute() {
  const { id, inspectionId } = useLocalSearchParams<{ id: string; inspectionId?: string }>()
  const { state } = useSession()
  const { hive, loading } = useHive(id)
  if (!hive)
    return loading ? null : <NotAvailable icon={Honeycomb} title="Esta colmena ya no existe." />
  return (
    <CameraScreen
      organizationId={hive.organization_id}
      hiveId={hive.id}
      inspectionId={inspectionId ?? null}
      userId={state.status === 'signedIn' ? state.session.user.id : ''}
      onDone={() => router.back()}
    />
  )
}
