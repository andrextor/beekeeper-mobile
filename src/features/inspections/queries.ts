import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { useLocalQuery } from '@/db/useLocalQuery'

export type InspectionDetail = {
  inspection: ServerRow<'inspections'>
  hiveName: string | null
  author: string | null
  events: ServerRow<'hive_events'>[]
}

/** One live inspection with its hive, author and the events recorded during it. */
export function useInspection(id: string): { detail: InspectionDetail | null; loading: boolean } {
  const { rows, loading } = useLocalQuery<LocalRow>(
    `select i.*, h.name as hive_name, coalesce(nullif(p.display_name, ''), p.email) as author
     from inspections i
     left join hives h on h.id = i.hive_id
     left join profiles_cache p on p.id = i.created_by
     where i.id = ? and i.deleted_at is null`,
    [id],
    ['inspections', 'hives', 'profiles_cache'],
  )
  const events = useLocalQuery<LocalRow>(
    'select * from hive_events where inspection_id = ? and deleted_at is null order by occurred_at',
    [id],
    ['hive_events'],
  ).rows
  const row = rows[0]
  if (!row) return { detail: null, loading }
  return {
    detail: {
      inspection: fromLocal('inspections', row),
      hiveName: typeof row.hive_name === 'string' ? row.hive_name : null,
      author: typeof row.author === 'string' ? row.author : null,
      events: events.map((e) => fromLocal('hive_events', e)),
    },
    loading,
  }
}
