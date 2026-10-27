import { router, useFocusEffect } from 'expo-router'
import { LogOut, UserPlus, Users } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { FormError } from '@/components/ui/FormError'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import { Title } from '@/components/ui/Title'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import { useActiveMembership, useSession } from '@/features/auth/session'
import {
  fetchInvites,
  fetchMembers,
  type Invite,
  type Member,
  removeMember,
  revokeInvite,
  setMemberRole,
} from '@/features/members/api'
import { leaveFinca, pendingForFinca } from '@/features/members/leave'
import { MemberRow, memberName } from '@/features/members/MemberRow'
import { MemberSheet } from '@/features/members/MemberSheet'
import type { Role } from '@/features/sync/members'
import { syncNow } from '@/features/sync/triggers'
import { errorCode, isNetworkError, messageFor } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { roleLabels } from '@/lib/labels'
import { color } from '@/lib/theme'

type Loaded =
  | { status: 'loading' }
  | { status: 'offline' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; members: Member[]; invites: Invite[] }

/** Online only: B2 RPCs check roles at call time, so nothing here is queued or cached. */
export default function MembersScreen() {
  const { state, refreshMemberships } = useSession()
  const active = useActiveMembership()
  const owner = active?.role === 'owner'
  const organizationId = active?.organization_id ?? ''
  const userId = state.status === 'signedIn' ? state.session.user.id : ''
  const finca = active?.organization_name
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' })
  const [chosen, setChosen] = useState<Member | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leavePending, setLeavePending] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!organizationId) return
    try {
      const [members, invites] = await Promise.all([
        fetchMembers(organizationId),
        owner ? fetchInvites(organizationId) : Promise.resolve([]),
      ])
      setLoaded({ status: 'ready', members, invites })
    } catch (e) {
      setLoaded(
        isNetworkError(e) ? { status: 'offline' } : { status: 'failed', message: messageFor(e) },
      )
    }
  }, [organizationId, owner])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  if (!active) return <NotAvailable icon={Users} title="Elige una finca primero." />

  /** Runs an action, then reloads the list and this person's own roles. */
  const act = async (action: () => Promise<void>, done: string): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      await action()
      showToast(done)
      await Promise.all([load(), refreshMemberships()])
      return true
    } catch (e) {
      setError(messageFor(e))
      if (errorCode(e) === 'organization_deleted') void syncNow()
      return false
    } finally {
      setBusy(false)
    }
  }

  const changeRole = async (role: Role) => {
    if (!chosen) return
    const ok = await act(
      () => setMemberRole(organizationId, chosen.user_id, role),
      `${memberName(chosen)} ahora es ${roleLabels[role].toLowerCase()}`,
    )
    if (ok) setChosen(null)
  }

  const remove = async () => {
    if (!chosen) return
    const ok = await act(
      () => removeMember(organizationId, chosen.user_id),
      `${memberName(chosen)} ya no está en la finca`,
    )
    if (ok) setChosen(null)
  }

  const leave = async () => {
    setBusy(true)
    setError(null)
    try {
      await leaveFinca(organizationId, userId)
      // The sync may have failed after the server call: the fresh list still drops the finca.
      await refreshMemberships()
      setLeavePending(null)
      showToast(`Saliste de ${finca ?? 'la finca'}`)
      router.dismissTo('/(tabs)')
    } catch (e) {
      setError(messageFor(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="flex-1">
      <Screen>
        <BackButton />
        <Title text={`Personas de ${finca ?? 'la finca'}`} />
        {loaded.status === 'offline' ? (
          <ErrorState
            title="Sin conexión"
            body="Conéctate para ver e invitar personas."
            onRetry={() => void load()}
          />
        ) : loaded.status === 'failed' ? (
          <ErrorState
            title="No pudimos cargar las personas"
            body={loaded.message}
            onRetry={() => void load()}
          />
        ) : loaded.status === 'ready' ? (
          <>
            <Card className="overflow-hidden p-0">
              {loaded.members.map((m) => (
                <MemberRow
                  key={m.user_id}
                  member={m}
                  me={m.user_id === userId}
                  onPress={
                    owner && m.user_id !== userId
                      ? () => {
                          setError(null)
                          setChosen(m)
                        }
                      : undefined
                  }
                />
              ))}
            </Card>
            {loaded.invites.length ? (
              <View className="gap-3">
                <Text accessibilityRole="header" className="font-display text-section text-text">
                  Códigos sin usar
                </Text>
                {loaded.invites.map((invite) => (
                  <Card key={invite.id} className="gap-3">
                    <Text className="font-sans-semibold text-body text-text">
                      {invite.label || 'Código sin nombre'}
                    </Text>
                    <Text className="font-sans text-caption text-muted">
                      {`${roleLabels[invite.role]} · Vence el ${formatDate(invite.expires_at)}`}
                    </Text>
                    <Button
                      variant="secondary"
                      label="Cancelar código"
                      disabled={busy}
                      onPress={() => void act(() => revokeInvite(invite.id), 'Código cancelado')}
                    />
                  </Card>
                ))}
              </View>
            ) : null}
            {owner ? (
              <Button
                icon={UserPlus}
                label="Invitar persona"
                className="min-h-field"
                onPress={() => router.push('/invite')}
              />
            ) : null}
            <FormError message={chosen || leavePending !== null ? null : error} />
            <Button
              variant="secondary"
              icon={LogOut}
              label="Salir de esta finca"
              onPress={async () => {
                setError(null)
                try {
                  setLeavePending(await pendingForFinca(await getDb(), organizationId))
                } catch (e) {
                  setError(messageFor(e))
                }
              }}
            />
          </>
        ) : (
          <ActivityIndicator color={color.primary} size="large" />
        )}
      </Screen>

      <MemberSheet
        // A new member opens on the first step, never on a leftover "Quitar".
        key={chosen?.user_id ?? 'none'}
        member={chosen}
        busy={busy}
        error={error}
        onRole={(role) => void changeRole(role)}
        onRemove={() => void remove()}
        onClose={() => {
          setChosen(null)
          setError(null)
        }}
      />
      <Sheet
        visible={leavePending !== null}
        title="Salir de esta finca"
        onClose={() => {
          setLeavePending(null)
          setError(null)
        }}
      >
        <Text className="font-sans text-body text-text">
          {leavePending
            ? `Tienes ${leavePending} registros sin sincronizar de esta finca. Si sales se perderán.`
            : 'Se borrarán de este teléfono los datos y las fotos de esta finca. Para volver necesitas un código nuevo.'}
        </Text>
        <FormError message={error} />
        {leavePending ? (
          <Button
            label="Sincronizar primero"
            onPress={() => {
              setLeavePending(null)
              void syncNow()
              router.navigate('/pending')
            }}
          />
        ) : (
          <Button variant="ghost" label="Cancelar" onPress={() => setLeavePending(null)} />
        )}
        <Button
          variant="danger"
          icon={LogOut}
          label={leavePending ? 'Salir igual' : 'Salir'}
          className="min-h-field"
          loading={busy}
          onPress={() => void leave()}
        />
      </Sheet>
    </View>
  )
}
