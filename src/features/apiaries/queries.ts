import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { useLocalQuery } from '@/db/useLocalQuery'

export type Apiary = ServerRow<'apiaries'>
export type ApiarySummary = Apiary & { active_hives: number; last_inspection: string | null }

const watched = ['apiaries', 'hives', 'inspections'] as const

const listSql = `select a.*,
    (select count(*) from hives h
      where h.apiary_id = a.id and h.deleted_at is null and h.status = 'active') as active_hives,
    (select max(i.inspected_at) from inspections i join hives h on h.id = i.hive_id
      where h.apiary_id = a.id and h.deleted_at is null and i.deleted_at is null) as last_inspection
  from apiaries a
  where a.organization_id = ? and a.deleted_at is null
  order by a.name collate nocase
  limit 500`

/** The active finca's live apiaries, by name, with their active hives and last inspection. */
export function useApiaries(organizationId: string): {
  apiaries: ApiarySummary[]
  loading: boolean
} {
  const { rows, loading } = useLocalQuery<LocalRow>(listSql, [organizationId], watched)
  const apiaries = rows.map((row) => ({
    ...fromLocal('apiaries', row),
    active_hives: Number(row.active_hives ?? 0),
    last_inspection: typeof row.last_inspection === 'string' ? row.last_inspection : null,
  }))
  return { apiaries, loading }
}

/** One live apiary, or `null` once it is deleted or purged. */
export function useApiary(id: string): { apiary: Apiary | null; loading: boolean } {
  const { rows, loading } = useLocalQuery<LocalRow>(
    'select * from apiaries where id = ? and deleted_at is null',
    [id],
    ['apiaries'],
  )
  const row = rows[0]
  return { apiary: row ? fromLocal('apiaries', row) : null, loading }
}

/** Id and name of the finca's live apiaries: the hive form's picker and the uniqueness check. */
export function useApiaryNames(organizationId: string): { id: string; name: string }[] {
  return useLocalQuery<{ id: string; name: string }>(
    'select id, name from apiaries where organization_id = ? and deleted_at is null order by name collate nocase',
    [organizationId],
    ['apiaries'],
  ).rows
}
