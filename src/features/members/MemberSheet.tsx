import { useState } from 'react'
import { Text } from 'react-native'

import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { Sheet } from '@/components/ui/Sheet'
import type { Role } from '@/features/sync/members'
import type { Member } from './api'
import { memberName } from './MemberRow'

type Props = {
  member: Member | null
  busy: boolean
  error: string | null
  onRole: (role: Role) => void
  onRemove: () => void
  onClose: () => void
}

/** Owner actions on another member; removing takes a second, explicit step. */
export function MemberSheet({ member, busy, error, onRole, onRemove, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const close = () => {
    setConfirming(false)
    onClose()
  }
  const name = member ? memberName(member) : ''
  const email = member?.profiles?.email ?? name

  return (
    <Sheet visible={member !== null} title={name} onClose={close}>
      {confirming ? (
        <>
          <Text className="font-sans text-body text-text">
            {`${email} ya no podrá ver ni registrar nada en esta finca. Lo que hizo se queda en el historial.`}
          </Text>
          <FormError message={error} />
          <Button
            variant="danger"
            label="Quitar"
            className="min-h-field"
            loading={busy}
            onPress={onRemove}
          />
          <Button variant="ghost" label="Cancelar" onPress={() => setConfirming(false)} />
        </>
      ) : (
        <>
          <FormError message={error} />
          <Button
            variant="secondary"
            label={member?.role === 'owner' ? 'Hacer revisor' : 'Hacer propietario'}
            loading={busy}
            onPress={() => onRole(member?.role === 'owner' ? 'reviewer' : 'owner')}
          />
          <Button variant="danger" label="Quitar de la finca" onPress={() => setConfirming(true)} />
          <Button variant="secondary" label="Cerrar" onPress={close} />
        </>
      )}
    </Sheet>
  )
}
