# M6 · Hive detail and timeline — spec

Date: 2026-10-25 · Branch: `feat/m6-hive-timeline` · Status: **awaiting OK** · Version: 0.6.0

## Problem

After scanning, the beekeeper needs in five seconds: what happened last time, whether something is pending, and one big button to start the inspection. The whole history must be readable offline.

## Decisions

### Screen `src/app/hive/[id].tsx`

Top to bottom:

| Block | Content |
|-------|---------|
| Header | Apiary › hive name (Arsenal 26), status badge (DESIGN.md hive status), `SyncChip` for the hive's pending rows |
| Attention card (only if any) | Last inspection `attention_level` `soon`/`urgent` (`clock` / `siren`, `honey` / `danger`), `next_inspection_on` due or overdue ("Revisión atrasada 3 días"), active treatment (`treatment` event with `ends_on` ≥ today) |
| Last inspection facts | "Última revisión hace 12 días · por Ana" + up to 4 facts: Fuerza, Reina (vista / no vista / no revisado), Cría (cuadros), Reservas |
| **Nueva revisión** | Full-width 72-dp `primary` button, `clipboard-check` icon, fixed above the tab bar (thumb zone) |
| Hive facts (collapsed) | Type, brood boxes, supers, origin, age from `colony_started_on`, queen year + color dot + marked + origin, notes |
| Photos strip | Last 10 thumbnails (only once M9 exists; hidden before), tap → viewer |
| Timeline | Inspections and events merged, newest first |

Owner extra actions in a header menu: Editar colmena (M4), Etiqueta QR / Cambiar etiqueta (M5).

### Timeline data (local)

`src/features/hives/timeline.ts`:

- Two local queries per page, each `limit 30` with a `before` cursor (`inspected_at` / `occurred_at` < cursor), `deleted_at is null`: `inspections where hive_id = ?` and `hive_events where hive_id = ?` (note events linked to an inspection are grouped under it, not shown as separate items).
- Merge by date desc, take 30, the last item's date is the next cursor. "Cargar más" button at the end (no infinite scroll: easier with gloves, bounded work).
- Each item carries its sync state (pending / synced / requires attention) from the outbox.

### Summary lines (`src/features/hives/summary.ts`, pure, tested)

| Kind | Example line |
|------|--------------|
| Inspection | "Fuerza 4 · Reina vista · 3 cuadros de cría · Reservas bajas" (order: strength, queen, brood frames, stores, then varroa %, pests count; max 4 parts; `not_checked` → "Reina no revisada"; null → omitted) |
| `feeding` | "Alimentación · Jarabe 1:1 · 2 l" |
| `treatment` | "Tratamiento · Ácido oxálico · goteo · retiro 0 días" |
| `queen_change` | "Cambio de reina · 2026 · blanca" |
| `harvest` | "Cosecha · Miel · 12 kg" |
| `split` / `merge` / `transfer` / `swarm` / `loss` | "División", "Unión", "Traslado", "Enjambre capturado" / "Enjambre perdido", "Pérdida · Hambre" |
| `note` (standalone) | first 80 characters of `details.text` |
| `qr_relabel` | "Cambio de etiqueta QR" |
| unknown type / missing keys | "Evento" / the parts it can read; never throws |

Labels come from `src/lib/labels.ts` (M4), which mirrors `../beekeeper/docs/api.md`. The admin keeps its own copy in another repo (accepted: two repos, one contract; both test every enum value).

Tap an inspection → `src/app/inspection/[id].tsx` read view: every recorded field with its label, `not_checked` as "No revisado", nulls hidden, transcript in a quote block, notes, photos. Edit button only for the author or an owner (B4 RLS), opening field mode (M7) on a copy.

### Server fallback for history not on the phone yet

The first sync of an organization pulls everything (M3), so history is normally local. Until the active organization's first full pull has finished (`sync_state.initial_pull_done = false`) and the phone is online, the timeline calls `rpc('hive_timeline', { p_hive_id, p_before, p_limit: 30 })` (B4) instead, with a banner "Mostrando historial del servidor mientras se descarga". Offline in that state → local items plus "Parte del historial aún no está en este teléfono".

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
- RPC `hive_timeline(p_hive_id, p_before, p_limit)` (B4).

## Out of scope

Charts (strength over time), filters by kind, exporting a hive's history, the photo viewer itself (M9).
