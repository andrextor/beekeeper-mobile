import { router, useLocalSearchParams } from 'expo-router'
import { Lock, MapPin, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Text } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import { Title } from '@/components/ui/Title'
import { showToast, undoFailed } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { saveRow } from '@/db/write'
import { ApiaryForm, toDraft } from '@/features/apiaries/ApiaryForm'
import { useApiary, useApiaryNames } from '@/features/apiaries/queries'
import type { ApiaryFields } from '@/features/apiaries/schema'
import { useRole } from '@/features/auth/session'
import { useHiveNames } from '@/features/hives/queries'

export default function EditApiaryScreen() {
  const { id, nameError } = useLocalSearchParams<{ id: string; nameError?: string }>()
  const owner = useRole() === 'owner'
  const { apiary, loading } = useApiary(id)
  const names = useApiaryNames(apiary?.organization_id ?? '')
  const hives = useHiveNames(id)
  const [confirming, setConfirming] = useState(false)

  if (!owner) return <NotAvailable icon={Lock} title="Solo el propietario puede editar." />
  if (!apiary)
    return loading ? null : <NotAvailable icon={MapPin} title="Este apiario ya no existe." />

  const save = async (fields: ApiaryFields) => {
    await saveRow(await getDb(), 'apiaries', { ...apiary, ...fields })
    showToast('Guardado en este dispositivo')
    router.back()
  }

  // B3 refuses it too (`apiary_not_empty`); dead hives count, as on the server.
  const blocked = hives.names.length > 0

  const remove = async () => {
    const db = await getDb()
    await saveRow(db, 'apiaries', { ...apiary, deleted_at: new Date().toISOString() })
    setConfirming(false)
    router.dismissTo('/apiaries')
    showToast('Apiario eliminado', {
      durationMs: 5000,
      onUndo: () =>
        saveRow(db, 'apiaries', { ...apiary, deleted_at: null }).catch(() =>
          showToast(undoFailed, { tone: 'danger' }),
        ),
    })
  }

  return (
    <Screen>
      <BackButton />
      <Title text="Editar apiario" />
      <ApiaryForm
        initial={toDraft(apiary)}
        otherNames={names.filter((n) => n.id !== id).map((n) => n.name)}
        nameError={nameError || undefined}
        onSave={save}
      />
      <Button
        variant="danger"
        icon={Trash2}
        label="Eliminar apiario"
        disabled={hives.loading}
        onPress={() => setConfirming(true)}
      />
      <Sheet
        visible={confirming}
        title={blocked ? 'No se puede eliminar' : `¿Eliminar ${apiary.name}?`}
        onClose={() => setConfirming(false)}
      >
        <Text className="font-sans text-body text-text">
          {blocked
            ? 'El apiario todavía tiene colmenas. Muévelas o elimínalas primero.'
            : 'Desaparece de la lista en este teléfono y en los demás. Puedes deshacerlo durante 5 segundos.'}
        </Text>
        {blocked ? (
          <Button label="Entendido" onPress={() => setConfirming(false)} />
        ) : (
          <>
            <Button variant="ghost" label="Cancelar" onPress={() => setConfirming(false)} />
            <Button variant="danger" label="Eliminar apiario" onPress={remove} />
          </>
        )}
      </Sheet>
    </Screen>
  )
}
