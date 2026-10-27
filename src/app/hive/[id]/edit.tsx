import { router, useLocalSearchParams } from 'expo-router'
import { Lock, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Text } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Honeycomb } from '@/components/ui/icons'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Sheet } from '@/components/ui/Sheet'
import { showToast, undoFailed } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { saveRow } from '@/db/write'
import { useApiaryNames } from '@/features/apiaries/queries'
import { useRole } from '@/features/auth/session'
import { HiveForm, toDraft } from '@/features/hives/HiveForm'
import { useHive } from '@/features/hives/queries'
import type { HiveFields } from '@/features/hives/schema'

export default function EditHiveScreen() {
  const { id, nameError } = useLocalSearchParams<{ id: string; nameError?: string }>()
  const owner = useRole() === 'owner'
  const { hive, loading } = useHive(id)
  const apiaries = useApiaryNames(hive?.organization_id ?? '')
  const [confirming, setConfirming] = useState(false)

  if (!owner) return <NotAvailable icon={Lock} title="Solo el propietario puede editar." />
  if (!hive)
    return loading ? null : <NotAvailable icon={Honeycomb} title="Esta colmena ya no existe." />

  const { apiary_name: _, ...row } = hive

  const save = async (fields: HiveFields) => {
    // ponytail: a move between apiaries is a plain update until M10 writes its `transfer` event.
    await saveRow(await getDb(), 'hives', { ...row, ...fields })
    showToast('Guardado en este dispositivo')
    router.back()
  }

  // History stays on the server (B5); screens just stop showing this hive.
  const remove = async () => {
    const db = await getDb()
    await saveRow(db, 'hives', { ...row, deleted_at: new Date().toISOString() })
    setConfirming(false)
    router.dismissTo({ pathname: '/apiary/[id]', params: { id: row.apiary_id } })
    showToast('Colmena eliminada', {
      durationMs: 5000,
      onUndo: () =>
        saveRow(db, 'hives', { ...row, deleted_at: null }).catch(() =>
          showToast(undoFailed, { tone: 'danger' }),
        ),
    })
  }

  return (
    <>
      <HiveForm
        title={`Editar ${hive.name}`}
        header={<BackButton />}
        initial={toDraft(hive)}
        hiveId={id}
        nameError={nameError || undefined}
        apiaries={apiaries}
        onSave={save}
        footer={
          <Button
            variant="danger"
            icon={Trash2}
            label="Eliminar colmena"
            onPress={() => setConfirming(true)}
          />
        }
      />
      <Sheet
        visible={confirming}
        title={`¿Eliminar ${hive.name}?`}
        onClose={() => setConfirming(false)}
      >
        <Text className="font-sans text-body text-text">
          Su historial se conserva, pero deja de aparecer en las listas. Puedes deshacerlo durante 5
          segundos.
        </Text>
        <Button variant="secondary" label="Cancelar" onPress={() => setConfirming(false)} />
        <Button variant="danger" label="Eliminar colmena" onPress={remove} />
      </Sheet>
    </>
  )
}
