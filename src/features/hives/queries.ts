import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { useLocalQuery } from '@/db/useLocalQuery'

export type Hive = ServerRow<'hives'>
export type HiveSummary = Hive & { last_inspection: string | null; attention_level: string | null }

const text = (value: unknown) => (typeof value === 'string' ? value : null)

const listSql = (all: boolean) => `select h.*,
    (select max(i.inspected_at) from inspections i
      where i.hive_id = h.id and i.deleted_at is null) as last_inspection,
    (select i.attention_level from inspections i
      where i.hive_id = h.id and i.deleted_at is null
      order by i.inspected_at desc, i.id desc limit 1) as attention_level
  from hives h
  where h.apiary_id = ? and h.deleted_at is null${all ? '' : " and h.status = 'active'"}
  order by h.name collate nocase
  limit 500`

/** An apiary's live hives (active ones only unless `all`), with the latest inspection's attention. */
export function useHives(apiaryId: string, all: boolean): HiveSummary[] {
  const { rows } = useLocalQuery<LocalRow>(listSql(all), [apiaryId], ['hives', 'inspections'])
  return rows.map((row) => ({
    ...fromLocal('hives', row),
    last_inspection: text(row.last_inspection),
    attention_level: text(row.attention_level),
  }))
}

export type HiveDetail = Hive & { apiary_name: string | null }

/** One live hive with its apiary's name, or `null` once it is deleted or purged. */
export function useHive(id: string): { hive: HiveDetail | null; loading: boolean } {
  const { rows, loading } = useLocalQuery<LocalRow>(
    `select h.*, a.name as apiary_name from hives h left join apiaries a on a.id = h.apiary_id
     where h.id = ? and h.deleted_at is null`,
    [id],
    ['hives', 'apiaries'],
  )
  const row = rows[0]
  return {
    hive: row ? { ...fromLocal('hives', row), apiary_name: text(row.apiary_name) } : null,
    loading,
  }
}

/** Names of the live hives of an apiary: the next-name suggestion and the local uniqueness check. */
export function useHiveNames(apiaryId: string): {
  names: { id: string; name: string }[]
  loading: boolean
} {
  const { rows, loading } = useLocalQuery<{ id: string; name: string }>(
    'select id, name from hives where apiary_id = ? and deleted_at is null',
    [apiaryId],
    ['hives'],
  )
  return { names: rows, loading }
}

export type FincaHive = { id: string; name: string; apiary_name: string | null }

/** Every live hive of the finca with its apiary, for "Asignar a una colmena". */
export function useFincaHives(organizationId: string): FincaHive[] {
  return useLocalQuery<FincaHive>(
    `select h.id, h.name, a.name as apiary_name from hives h left join apiaries a on a.id = h.apiary_id
     where h.organization_id = ? and h.deleted_at is null
     order by a.name collate nocase, h.name collate nocase limit 500`,
    [organizationId],
    ['hives', 'apiaries'],
  ).rows
}

/** What the attention card needs: the latest inspection and treatments still running. */
export function useHiveAttentionData(hiveId: string, today: string) {
  const last = useLocalQuery<{ attention_level: string | null; next_inspection_on: string | null }>(
    `select attention_level, next_inspection_on from inspections
     where hive_id = ? and deleted_at is null order by inspected_at desc, id desc limit 1`,
    [hiveId],
    ['inspections'],
  ).rows[0]
  const treatments = useLocalQuery<{ details: string }>(
    `select details from hive_events where hive_id = ? and type = 'treatment' and deleted_at is null
     and json_extract(details, '$.ends_on') >= ? order by occurred_at desc limit 5`,
    [hiveId, today],
    ['hive_events'],
  ).rows
  return {
    last: last ?? null,
    treatments: treatments.map((t) => ({ details: JSON.parse(t.details) as unknown })),
  }
}

/** The hive's own changes still in the outbox (its row and everything recorded on it). */
export function useHiveQueue(hiveId: string): { pending: number; attention: number } {
  const row = useLocalQuery<{ pending: number; attention: number }>(
    `select
       coalesce(sum(state = 'pending'), 0) as pending,
       coalesce(sum(state = 'failed_permanent'), 0) as attention
     from outbox where (table_name = 'hives' and row_id = ?)
       or json_extract(payload, '$.hive_id') = ?`,
    [hiveId, hiveId],
    ['outbox'],
  ).rows[0]
  return { pending: row?.pending ?? 0, attention: row?.attention ?? 0 }
}
