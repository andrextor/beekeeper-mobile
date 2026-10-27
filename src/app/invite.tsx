import { router } from 'expo-router'
import { Lock, Share2 } from 'lucide-react-native'
import { useState } from 'react'
import { Share, Text } from 'react-native'
import { ChipSelect } from '@/components/field/ChipSelect'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { TextField } from '@/components/ui/TextField'
import { Title } from '@/components/ui/Title'
import { useActiveMembership } from '@/features/auth/session'
import { createInvite, type NewInvite } from '@/features/members/api'
import { inviteMessage } from '@/features/members/invite-message'
import type { Role } from '@/features/sync/members'
import { messageFor } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { roleLabels } from '@/lib/labels'

const roleHelp: Record<Role, string> = {
  reviewer:
    'Puede ver todo y registrar revisiones, notas, fotos y actividades. No puede cambiar apiarios ni colmenas.',
  owner: 'Puede hacer todo, incluso invitar y quitar personas.',
}

/** The plain code exists only in `create_invite`'s answer: shown here once, never stored. */
export default function InviteScreen() {
  const active = useActiveMembership()
  const [label, setLabel] = useState('')
  const [role, setRole] = useState<Role>('reviewer')
  const [created, setCreated] = useState<NewInvite | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (active?.role !== 'owner')
    return <NotAvailable icon={Lock} title="Solo el propietario puede invitar personas." />

  const create = async () => {
    setSaving(true)
    setError(null)
    try {
      setCreated(await createInvite(active.organization_id, role, label.trim()))
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <Screen>
        <BackButton />
        <Title text="Código listo" />
        <Card className="items-center gap-3">
          <Text selectable className="font-mono text-code text-text">
            {created.code}
          </Text>
          <Text className="text-center font-sans text-body text-muted">
            {`Vence el ${formatDate(created.expires_at)} · sirve una sola vez`}
          </Text>
        </Card>
        <Text className="font-sans text-body text-text">
          {`Envíaselo a ${label.trim() || 'la persona'}. Crea su cuenta en la app y escribe el código en "Tengo un código".`}
        </Text>
        <Button
          icon={Share2}
          label="Compartir por WhatsApp"
          className="min-h-field"
          onPress={() =>
            void Share.share({
              message: inviteMessage(active.organization_name, created.code, created.expires_at),
            })
          }
        />
        <Button variant="secondary" label="Listo" onPress={() => router.back()} />
      </Screen>
    )
  }

  return (
    <Screen>
      <BackButton />
      <Title text="Invitar persona" />
      <TextField
        label="¿Para quién es? (opcional)"
        value={label}
        onChangeText={setLabel}
        maxLength={80}
        autoComplete="off"
      />
      <ChipSelect
        label="Rol"
        options={roleLabels}
        value={[role]}
        onChange={(v) => {
          const next = v[0]
          if (next === 'owner' || next === 'reviewer') setRole(next)
        }}
      />
      <Text className="font-sans text-body text-muted">{roleHelp[role]}</Text>
      <FormError message={error} />
      <Button label="Crear código" className="min-h-field" loading={saving} onPress={create} />
    </Screen>
  )
}
