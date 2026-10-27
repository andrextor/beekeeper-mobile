import { router, useLocalSearchParams } from 'expo-router'
import { ClipboardCheck, Pencil } from 'lucide-react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { Title } from '@/components/ui/Title'
import { useRole, useSession } from '@/features/auth/session'
import { InspectionDetailView } from '@/features/inspections/InspectionDetailView'
import { useInspection } from '@/features/inspections/queries'
import { PhotoGrid } from '@/features/photos/PhotoGrid'
import { usePhotos } from '@/features/photos/queries'

/** Read view of one inspection; its author or an owner may edit it (B4 RLS). */
export default function InspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const { detail, loading } = useInspection(id)
  const photos = usePhotos({ inspectionId: id })

  if (!detail) {
    return loading ? null : (
      <NotAvailable icon={ClipboardCheck} title="Esta revisión aún no está en el teléfono." />
    )
  }
  const userId = state.status === 'signedIn' ? state.session.user.id : null
  const canEdit = owner || detail.inspection.created_by === userId

  return (
    <Screen>
      <BackButton />
      <Title text={`Revisión${detail.hiveName ? ` de ${detail.hiveName}` : ''}`} />
      <InspectionDetailView detail={detail} />
      {photos.length ? (
        <PhotoGrid
          photos={photos}
          onOpen={(photoId) => router.push({ pathname: '/photo/[id]', params: { id: photoId } })}
        />
      ) : null}
      {canEdit ? (
        <Button
          variant="secondary"
          icon={Pencil}
          label="Editar revisión"
          onPress={() =>
            router.push({
              pathname: '/hive/[id]/inspect',
              params: { id: detail.inspection.hive_id, inspectionId: id },
            })
          }
        />
      ) : null}
    </Screen>
  )
}
