import { useState } from 'react'
import { Text } from 'react-native'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Sheet } from '@/components/ui/Sheet'
import { messageFor } from '@/lib/errors'
import { signOut } from './session'

type Props = {
  /** Unsynced records counted when the sheet opened; `null` keeps it closed. */
  pending: number | null
  onClose: () => void
  /** Offered when there is something to sync and a place to watch it (the Pendientes tab). */
  onSyncFirst?: () => void
}

/** Signing out erases this phone's data: the sheet says how much is still unsent first. */
export function SignOutSheet({ pending, onClose, onSyncFirst }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await signOut()
    } catch (e) {
      setError(messageFor(e))
      setBusy(false)
    }
  }

  const close = () => {
    setError(null)
    onClose()
  }

  return (
    <Sheet visible={pending !== null} title="Cerrar sesión" onClose={close}>
      <Text className="font-sans text-body text-text">
        {pending
          ? `Tienes ${pending} registros sin sincronizar. Si cierras sesión se perderán.`
          : 'Se borrarán de este teléfono los datos de tu finca. Vuelven al ingresar de nuevo.'}
      </Text>
      <FormError message={error} />
      {pending && onSyncFirst ? (
        <Button label="Sincronizar primero" onPress={onSyncFirst} />
      ) : (
        <Button variant="ghost" label="Cancelar" onPress={close} />
      )}
      <Button
        variant="danger"
        label={pending ? 'Cerrar sesión igual' : 'Cerrar sesión'}
        loading={busy}
        onPress={confirm}
      />
    </Sheet>
  )
}
