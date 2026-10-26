import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { Hexagon } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Text } from 'react-native'

import { BackButton } from '@/components/ui/BackButton'
import { NotAvailable } from '@/components/ui/NotAvailable'
import { Screen } from '@/components/ui/Screen'
import { showToast } from '@/components/ui/ToastHost'
import { getDb } from '@/db/database'
import type { ServerRow } from '@/db/mapping'
import { useApiaryNames } from '@/features/apiaries/queries'
import { useRole, useSession } from '@/features/auth/session'
import { hiveEffects } from '@/features/events/effects'
import { EventForm, type EventResult } from '@/features/events/EventForm'
import { useRecentProducts } from '@/features/events/queries'
import { saveEvent } from '@/features/events/save'
import { type EventType, isEventType, pickableTypes } from '@/features/events/schemas'
import { TypePicker } from '@/features/events/TypePicker'
import { useHive, useHiveNames } from '@/features/hives/queries'
import { handBack, takeHandBack } from '@/lib/hand-back'
import { uuid } from '@/lib/ids'

/**
 * Registrar actividad. With `draftId` (field mode) the event goes back into the draft and is
 * written at Terminar; otherwise it is saved now, with its hive updates for an owner.
 */
export default function NewEventScreen() {
  const { id, type, draftId } = useLocalSearchParams<{
    id: string
    type?: string
    draftId?: string
  }>()
  const { state } = useSession()
  const owner = useRole() === 'owner'
  const { hive, loading } = useHive(id)
  const apiaries = useApiaryNames(hive?.organization_id ?? '')
  const apiaryHives = useHiveNames(hive?.apiary_id ?? '').names
  const recentProducts = useRecentProducts(hive?.organization_id ?? '')
  const [newHiveId, setNewHiveId] = useState<string | null>(null)

  // The hive form of a split or swarm hands its new id back here.
  useFocusEffect(
    useCallback(() => {
      const created = takeHandBack('newHiveId')
      if (typeof created === 'string') setNewHiveId(created)
    }, []),
  )

  if (!hive)
    return loading ? null : <NotAvailable icon={Hexagon} title="Esta colmena ya no existe." />
  const userId = state.status === 'signedIn' ? state.session.user.id : ''

  if (!type || !isEventType(type)) {
    return (
      <Screen>
        <BackButton />
        <Text accessibilityRole="header" className="font-display text-title text-text">
          Registrar actividad
        </Text>
        <TypePicker
          // Field mode has its own note tiles.
          types={draftId ? pickableTypes.filter((t) => t !== 'note') : pickableTypes}
          onPick={(picked: EventType) => router.setParams({ type: picked })}
        />
      </Screen>
    )
  }

  const save = async ({ details, occurredAt, choices }: EventResult) => {
    const patches = hiveEffects(type, details, hive.id, owner, choices)
    if (draftId) {
      handBack('draftEvent', {
        draftId,
        event: { id: uuid(), type, details, at: occurredAt, hivePatches: patches },
      })
      router.back()
      return
    }
    const now = new Date().toISOString()
    await saveEvent(
      await getDb(),
      {
        id: uuid(),
        organization_id: hive.organization_id,
        hive_id: hive.id,
        inspection_id: null,
        type,
        occurred_at: occurredAt,
        details: details as ServerRow<'hive_events'>['details'],
        created_by: userId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      patches,
    )
    showToast('Guardado en este dispositivo')
    router.back()
  }

  return (
    <EventForm
      type={type}
      initial={{
        details: type === 'note' ? { source: 'text' } : {},
        occurredAt: new Date().toISOString(),
      }}
      owner={owner}
      editing={false}
      hive={hive}
      apiaries={apiaries}
      apiaryHives={apiaryHives}
      recentProducts={recentProducts}
      newHiveId={newHiveId}
      onCreateHive={(origin) =>
        router.push({
          pathname: '/hive/new',
          params: { apiaryId: hive.apiary_id, origin, returnTo: 'event' },
        })
      }
      onSave={save}
    />
  )
}
