import { fromLocal, type LocalRow, type ServerRow } from '@/db/mapping'
import { useLocalQuery } from '@/db/useLocalQuery'

/** The last 5 treatment products of the finca, as chips (spec M10 → Field use). */
export function useRecentProducts(organizationId: string): string[] {
  return useLocalQuery<{ product: string }>(
    `select json_extract(details, '$.product') as product from hive_events
     where organization_id = ? and type = 'treatment' and deleted_at is null and product is not null
     group by product order by max(occurred_at) desc limit 5`,
    [organizationId],
    ['hive_events'],
  ).rows.map((r) => r.product)
}

export function useEvent(id: string): { event: ServerRow<'hive_events'> | null; loading: boolean } {
  const { rows, loading } = useLocalQuery<LocalRow>(
    'select * from hive_events where id = ? and deleted_at is null',
    [id],
    ['hive_events'],
  )
  const row = rows[0]
  return { event: row ? fromLocal('hive_events', row) : null, loading }
}
