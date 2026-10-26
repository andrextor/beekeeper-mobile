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
