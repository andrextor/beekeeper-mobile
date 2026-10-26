# M6 · Hive detail and timeline — spec

Date: 2026-10-25 · Branch: `feat/m6-hive-timeline` · Status: **awaiting OK** · Version: 0.6.0

## Problem

After scanning, the beekeeper needs in five seconds: what happened last time, whether something is pending, and one big button to start the inspection. The whole history must be readable offline. And on opening the app, Inicio must say which hives need a visit.

## Decisions

### Screen `src/app/hive/[id]/index.tsx` (M4 built the facts part)

Top to bottom:

| Block | Content |
|-------|---------|
| Header | Apiary › hive name (Plus Jakarta Sans 26), status badge (DESIGN.md hive status), `SyncChip` for the hive's pending rows |
| Attention card (only if any) | Last inspection `attention_level` `soon`/`urgent` (`clock` / `siren`, `honey` / `danger`), `next_inspection_on` due or overdue ("Revisión atrasada 3 días"), active treatment (`treatment` event with `ends_on` ≥ today) |
| Last inspection facts | "Última revisión hace 12 días · por Ana" + up to 4 facts: Fuerza, Reina (vista / no vista / no revisado), Cría (cuadros), Reservas |
| **Nueva revisión** | Full-width 72-dp `primary` button, `clipboard-check` icon, fixed above the tab bar (thumb zone) |
| Hive facts (collapsed) | Type, brood boxes, supers, origin, age from `colony_started_on`, queen year + color dot + marked + origin, notes |
| Photos strip | Last 10 thumbnails (only once M9 exists; hidden before), tap → viewer |
| Timeline | Inspections and events merged, newest first |

Owner extra actions in a header menu: Editar colmena (M4), Etiqueta QR / Cambiar etiqueta (M5).

### Timeline data (local)

`src/features/hives/timeline.ts`:

- Two local queries per page, each `limit 30` with a `(at, id)` cursor, `deleted_at is null`: `inspections where hive_id = ? and (inspected_at, id) < (?, ?)` and `hive_events where hive_id = ? and (occurred_at, id) < (?, ?)` (note events linked to an inspection are grouped under it, not shown as separate items).
- Merge by `(at desc, id desc)`, take 30; the last item's `at` and `id` are the next cursor (same order and tie-break as `hive_timeline`: an event recorded during an inspection often shares its timestamp, so a date-only cursor would drop or repeat items). "Cargar más" button at the end (no infinite scroll: easier with gloves, bounded work).
- Each item carries its sync state (pending / synced / requires attention) from the outbox.

### Summary lines (`src/lib/inspection-summary.ts`, `src/lib/event-summary.ts`, pure, tested)

**Ported from the admin** (`../beekeeper/admin/src/lib/inspection-summary.ts`, `event-summary.ts`, with their tests), same parts, order and labels, so the phone and the panel read the same line:

| Kind | Example line |
|------|--------------|
| Inspection | "Fuerza 4 · Reina vista · 3 cuadros de cría · Reservas: Pocas" (then varroa, pests, signs; nulls and `not_checked` stores omitted; nothing recorded → "Sin datos registrados") |
| `feeding` | "Alimentación · Jarabe de azúcar 1:1 · 2 l" |
| `treatment` | "Tratamiento · Apivar · Tiras · Retiro: 0 días · Hasta el 30 nov 2026" |
| `queen_change` | "Cambio de reina · Reina 2026 · Blanco … · Comprada · Planificado" |
| `harvest` | "Cosecha · Miel · 12 kg · 2 alzas" |
| `swarm` / others | "Enjambre · Capturado"; split, merge and transfer show only the type (ids are not resolved) |
| `note` (standalone) | "Nota · <text>" (the row truncates visually at 2 lines) |
| `qr_relabel` | "Cambio de etiqueta QR · V1C01A7K2M → …" |
| unknown type / missing keys | "Evento" / the parts it can read; never throws |

`inspectionFields()` (the read view's label/value list) is ported too.

Labels come from `src/lib/labels.ts` (M1), which mirrors `../beekeeper/docs/api.md`. The summaries live in `src/lib/inspection-summary.ts` and `src/lib/event-summary.ts` (same names as the admin's `admin/src/lib/`), because `features/hives`, `features/inspections` and `features/events` (M10) all render them and features do not import each other. The admin keeps its own copy in another repo (accepted: two repos, one contract; both test every enum value).

Tap an inspection → `src/app/inspection/[id].tsx` read view: every recorded field with its label, `not_checked` as "No revisado", nulls hidden, transcript in a quote block, notes, photos. Edit button only for the author (`created_by`) or an owner (B4 RLS), opening field mode (M7) as `hive/[id]/inspect?inspectionId=`.

Author names come from `profiles_cache`; a missing profile (a member who left; `author_name = null` from the RPC) shows "Antiguo miembro".

### Server fallback for history not on the phone yet

The first sync of an organization pulls everything (M3), so history is normally local. Until the active organization's first full pull has finished (`sync_state.initial_pull_done = 0` for any of its tables, M3) and the phone is online, the timeline calls `rpc('hive_timeline', { p_hive_id, p_before, p_before_id, p_limit: 30 })` (B4) instead, with a banner "Mostrando historial del servidor mientras se descarga". Offline in that state → local items plus "Parte del historial aún no está en este teléfono".

### Inicio tab (`src/app/(tabs)/index.tsx`)

Local only, active organization, hives with `status = 'active'` and `deleted_at is null` (a dead or sold hive needs no visit; children of deleted hives are hidden everywhere):

1. **Para revisar**: hives whose latest inspection (B4 `hive_open_tasks` rule: latest non-deleted, ties by highest `id`) has `attention_level` `urgent` or `soon`, or `next_inspection_on` ≤ today. Urgent first, then most overdue. Item: hive name, apiary, reason ("Urgente", "Revisión atrasada 3 días"), 56 dp, opens the hive.
2. **Tareas**: the same latest inspections' `planned_actions` grouped by action ("Alimentar · 4 colmenas"), tap → list of those hives. Older inspections' actions are history, not tasks.
3. **Última actividad**: the 5 most recent inspections and events of the organization, with their summary line.

Empty state: "Todo al día" with "Escanear colmena" (72 dp). `src/features/hives/home.ts` (pure: `hivesToVisit(latestInspections, today)`, `openTasks(latestInspections)`) + test. Bounded: one query for the latest inspection per hive (window function), limit 50 per section with "Ver todas".

## Rejected alternatives

- Always reading the timeline from the server: breaks offline, the core requirement.
- Infinite scroll: unbounded work and accidental scrolling with gloves; one explicit button instead.
- A SQL `union all` view in SQLite: possible, but the two-query merge is simpler to test and pages identically to the RPC.

## Security constraints

The server fallback runs under RLS (`hive_timeline` is `security invoker`). Edit actions mirror B4 (author or owner); the server refuses anything else and the outbox would show "Requiere atención".

## Field use

- "Nueva revisión" always visible without scrolling, 72 dp, bottom.
- Attention card uses icon + word, not only color; readable at arm's length (20 sp).
- Works fully in airplane mode once synced.

## Backend contract used

- `inspections` (B4): `hive_id`, `inspected_at`, `inspected_by`, `source`, `transcript`, `population_strength`, `queen_seen`, `brood_frames`, `stores`, `varroa_*`, `pests`, `attention_level`, `next_inspection_on`, `deleted_at`.
- `hive_events` (B4): `type`, `occurred_at`, `inspection_id`, `details` shapes per type.
- `hives` (B3) facts; `profiles.display_name` for authors (B2, readable for co-members).
- RPC `hive_timeline(p_hive_id, p_before, p_before_id, p_limit)` (B4), rows `{ kind, id, at, created_by, author_name, data }`.
- View `hive_open_tasks` semantics (B4), computed locally for Inicio: the latest non-deleted inspection per hive, ties by highest `id`.

## Out of scope

Charts (strength over time), filters by kind, exporting a hive's history, the photo viewer itself (M9).
