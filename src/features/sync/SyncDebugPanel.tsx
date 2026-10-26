import { useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { getDb } from '@/db/database'
import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { useLocalQuery } from '@/db/useLocalQuery'
import { saveRow } from '@/db/write'
import { messageFor } from '@/lib/errors'
import { randomQrCode, uuid } from '@/lib/ids'
import { setForcedFailure } from './push'

type Props = { organizationId: string; userId: string; onMessage: (message: string) => void }

const testApiary = 'Apiario de prueba'

const stamp = () => {
  const now = new Date().toISOString()
  return { created_at: now, updated_at: now, deleted_at: null }
}

function blankInspection(
  organizationId: string,
  userId: string,
  hiveId: string,
): ServerRow<'inspections'> {
  return {
    ...stamp(),
    id: uuid(),
    organization_id: organizationId,
    created_by: userId,
    hive_id: hiveId,
    inspected_at: new Date().toISOString(),
    inspected_by: userId,
    source: 'manual',
    transcript: null,
    population_strength: 3,
    temperament: null,
    queen_seen: null,
    eggs_seen: null,
    larvae_seen: null,
    queen_cells: null,
    brood_frames: null,
    honey_frames: null,
    pollen_frames: null,
    brood_pattern: null,
    stores: null,
    varroa_method: null,
    varroa_count: null,
    varroa_sample_size: null,
    pests: null,
    disease_signs: null,
    weather: null,
    temperature_c: null,
    attention_level: null,
    planned_actions: null,
    next_inspection_on: null,
    notes: 'Revisión de prueba',
  }
}

/** Dev only (until M4 has real screens): local writes, forced failures, outbox and cursors. */
export function SyncDebugPanel({ organizationId, userId, onMessage }: Props) {
  const [name, setName] = useState('')
  const [failing, setFailing] = useState(false)
  const hives = useLocalQuery<{ id: string; name: string; _on_server: number }>(
    'select id, name, _on_server from hives where deleted_at is null and organization_id = ? order by name limit 20',
    [organizationId],
    ['hives'],
  ).rows
  const outbox = useLocalQuery<{ id: string; state: string; attempts: number }>(
    'select id, state, attempts from outbox order by created_at limit 30',
    [],
    ['outbox'],
  ).rows
  const cursors = useLocalQuery<{ organization_id: string; table_name: string; cursor: string }>(
    'select organization_id, table_name, cursor from sync_state order by organization_id, table_name',
    [],
    ['sync_state'],
  ).rows

  const act = (task: () => Promise<void>) => async () => {
    try {
      await task()
      onMessage('Guardado en este dispositivo')
    } catch (e) {
      onMessage(messageFor(e))
    }
  }

  const createHive = (withInspection: boolean) =>
    act(async () => {
      const db = await getDb()
      let apiaryId = (
        await db.getFirstAsync<{ id: string }>(
          'select id from apiaries where organization_id = ? and name = ? and deleted_at is null',
          [organizationId, testApiary],
        )
      )?.id
      if (!apiaryId) {
        apiaryId = uuid()
        await saveRow(db, 'apiaries', {
          ...stamp(),
          id: apiaryId,
          organization_id: organizationId,
          created_by: userId,
          name: testApiary,
          farm_name: null,
          place: null,
          latitude: null,
          longitude: null,
          altitude_m: null,
          flora_notes: null,
          water_source: null,
          notes: null,
        })
      }
      const hiveId = uuid()
      await saveRow(db, 'hives', {
        ...stamp(),
        id: hiveId,
        organization_id: organizationId,
        created_by: userId,
        apiary_id: apiaryId,
        name: name.trim() || `P-${randomQrCode().slice(0, 4)}`,
        qr_code: randomQrCode(),
        hive_type: null,
        brood_boxes: null,
        supers: null,
        colony_origin: null,
        colony_started_on: null,
        bee_race: null,
        queen_year: null,
        queen_marked: null,
        queen_color: null,
        queen_origin: null,
        status: 'active',
        notes: null,
      })
      if (withInspection) {
        await saveRow(db, 'inspections', blankInspection(organizationId, userId, hiveId))
      }
    })

  const addInspection = (hiveId: string) =>
    act(async () => {
      await saveRow(await getDb(), 'inspections', blankInspection(organizationId, userId, hiveId))
    })

  const editLatestInspection = (hiveId: string) =>
    act(async () => {
      const db = await getDb()
      const row = await db.getFirstAsync<LocalRow>(
        'select * from inspections where hive_id = ? and deleted_at is null order by inspected_at desc',
        [hiveId],
      )
      if (!row) throw new Error('Sin revisiones')
      const inspection = fromLocal('inspections', row)
      await saveRow(db, 'inspections', {
        ...inspection,
        notes: `Editada ${new Date().toLocaleTimeString()}`,
      })
    })

  const deleteHive = (hiveId: string) =>
    act(async () => {
      const db = await getDb()
      const row = await db.getFirstAsync<LocalRow>('select * from hives where id = ?', [hiveId])
      if (!row) return
      await saveRow(db, 'hives', {
        ...fromLocal('hives', row),
        deleted_at: new Date().toISOString(),
      })
    })

  return (
    <View className="gap-4">
      <Button
        variant={failing ? 'danger' : 'secondary'}
        label={failing ? 'Forzar error: activado' : 'Forzar error: apagado'}
        onPress={() => {
          setForcedFailure(!failing)
          setFailing(!failing)
        }}
      />
      <TextField
        label="Nombre de la colmena de prueba"
        value={name}
        onChangeText={setName}
        placeholder="Opcional"
      />
      <Button label="Crear colmena de prueba" onPress={createHive(false)} />
      <Button variant="secondary" label="Crear colmena con revisión" onPress={createHive(true)} />
      {hives.map((h) => (
        <Card key={h.id} className="gap-2">
          <Text className="font-sans-semibold text-body text-text">
            {h.name} {h._on_server ? '· en el servidor' : '· solo aquí'}
          </Text>
          <Button variant="secondary" label="Agregar revisión" onPress={addInspection(h.id)} />
          <Button
            variant="secondary"
            label="Editar revisión"
            onPress={editLatestInspection(h.id)}
          />
          <Button variant="danger" label="Eliminar colmena" onPress={deleteHive(h.id)} />
        </Card>
      ))}
      <Card className="gap-1">
        <Text className="font-sans-semibold text-body text-text">Outbox</Text>
        {outbox.map((o) => (
          <Text key={o.id} className="font-mono text-caption text-muted">
            {o.id.slice(0, 22)} {o.state} ×{o.attempts}
          </Text>
        ))}
      </Card>
      <Card className="gap-1">
        <Text className="font-sans-semibold text-body text-text">Cursores</Text>
        {cursors.map((c) => (
          <Text
            key={`${c.organization_id}/${c.table_name}`}
            className="font-mono text-caption text-muted"
          >
            {c.organization_id.slice(0, 8) || 'perfiles'} {c.table_name} {c.cursor.slice(0, 19)}
          </Text>
        ))}
      </Card>
    </View>
  )
}
