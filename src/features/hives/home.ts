import type { Db } from '@/db/db'
import { fromLocal, type LocalRow } from '@/db/mapping'
import { daysBetween } from '@/lib/dates'
import { eventSummary } from '@/lib/event-summary'
import { plural } from '@/lib/format'
import { inspectionSummary } from '@/lib/inspection-summary'
import { label, plannedActionLabels } from '@/lib/labels'
import { byNewest } from './timeline'

export type LatestInspection = {
  hive_id: string
  hive_name: string
  apiary_name: string | null
  attention_level: string | null
  next_inspection_on: string | null
  planned_actions: string[] | null
}

/**
 * B4 `hive_open_tasks`, on the phone: each live, active hive of the finca with its latest live
 * inspection (ties by the highest id). Older inspections are history, not tasks.
 */
export async function latestInspections(
  db: Db,
  organizationId: string,
): Promise<LatestInspection[]> {
  const rows = await db.getAllAsync<
    Omit<LatestInspection, 'planned_actions'> & { planned_actions: string | null }
  >(
    `select h.id as hive_id, h.name as hive_name, a.name as apiary_name,
       i.attention_level, i.next_inspection_on, i.planned_actions
     from hives h
     left join apiaries a on a.id = h.apiary_id
     join (
       select *, row_number() over (partition by hive_id order by inspected_at desc, id desc) as rn
       from inspections where deleted_at is null
     ) i on i.hive_id = h.id and i.rn = 1
     where h.organization_id = ? and h.deleted_at is null and h.status = 'active'
     limit 500`,
    [organizationId],
  )
  return rows.map((r) => ({
    ...r,
    planned_actions: r.planned_actions ? (JSON.parse(r.planned_actions) as string[]) : null,
  }))
}

export type Visit = { hiveId: string; hiveName: string; apiaryName: string | null; reason: string }

/** "Para revisar": urgent first, then the most overdue, then "soon". */
export function hivesToVisit(rows: readonly LatestInspection[], today: string): Visit[] {
  const scored = rows.flatMap((r) => {
    const late = r.next_inspection_on ? daysBetween(r.next_inspection_on, today) : null
    const urgent = r.attention_level === 'urgent'
    const soon = r.attention_level === 'soon'
    if (!urgent && !soon && (late === null || late < 0)) return []
    const reasons = [
      urgent && 'Urgente',
      late !== null && late > 0 && `Revisión atrasada ${plural(late, 'día', 'días')}`,
      late === 0 && 'Revisión para hoy',
      soon && 'Revisar pronto',
    ].filter((reason): reason is string => typeof reason === 'string')
    const visit: Visit = {
      hiveId: r.hive_id,
      hiveName: r.hive_name,
      apiaryName: r.apiary_name,
      reason: reasons.join(' · '),
    }
    return [{ visit, rank: urgent ? 2 : late !== null && late >= 0 ? 1 : 0, late: late ?? -1 }]
  })
  return scored
    .sort(
      (a, b) =>
        b.rank - a.rank || b.late - a.late || a.visit.hiveName.localeCompare(b.visit.hiveName),
    )
    .map((s) => s.visit)
}

export type Task = { action: string; label: string; hives: { id: string; name: string }[] }

/** "Tareas": the latest inspections' planned actions, grouped ("Alimentar · 4 colmenas"). */
export function openTasks(rows: readonly LatestInspection[]): Task[] {
  const tasks = new Map<string, Task>()
  for (const r of rows) {
    for (const action of r.planned_actions ?? []) {
      const task = tasks.get(action) ?? {
        action,
        label: label(plannedActionLabels, action),
        hives: [],
      }
      task.hives.push({ id: r.hive_id, name: r.hive_name })
      tasks.set(action, task)
    }
  }
  return [...tasks.values()].sort(
    (a, b) => b.hives.length - a.hives.length || a.label.localeCompare(b.label),
  )
}

export type Activity = {
  id: string
  at: string
  hiveId: string
  hiveName: string
  line: string
  inspection: boolean
}

/** "Última actividad": the finca's newest inspections and events on live hives. */
export async function recentActivity(
  db: Db,
  organizationId: string,
  limit = 5,
): Promise<Activity[]> {
  const inspections = await db.getAllAsync<LocalRow>(
    `select i.*, h.name as hive_name from inspections i join hives h on h.id = i.hive_id
     where i.organization_id = ? and i.deleted_at is null and h.deleted_at is null
     order by i.inspected_at desc, i.id desc limit ?`,
    [organizationId, limit],
  )
  const events = await db.getAllAsync<LocalRow>(
    `select e.*, h.name as hive_name from hive_events e join hives h on h.id = e.hive_id
     where e.organization_id = ? and e.deleted_at is null and h.deleted_at is null
       and not (e.type = 'note' and e.inspection_id is not null)
     order by e.occurred_at desc, e.id desc limit ?`,
    [organizationId, limit],
  )
  const hiveName = (row: LocalRow) => (typeof row.hive_name === 'string' ? row.hive_name : '')
  return [
    ...inspections.map((row): Activity => {
      const inspection = fromLocal('inspections', row)
      return {
        id: inspection.id,
        at: inspection.inspected_at,
        hiveId: inspection.hive_id,
        hiveName: hiveName(row),
        line: `Revisión · ${inspectionSummary(inspection)}`,
        inspection: true,
      }
    }),
    ...events.map((row): Activity => {
      const event = fromLocal('hive_events', row)
      return {
        id: event.id,
        at: event.occurred_at,
        hiveId: event.hive_id,
        hiveName: hiveName(row),
        line: eventSummary(event.type, event.details),
        inspection: false,
      }
    }),
  ]
    .sort(byNewest)
    .slice(0, limit)
}
