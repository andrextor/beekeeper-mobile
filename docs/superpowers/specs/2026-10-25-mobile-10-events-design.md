# M10 · Events: feeding, treatment, harvest, queen change, split, swarm, merge, transfer, loss — spec

Date: 2026-10-25 · Branch: `feat/m10-events` · Status: **awaiting OK** · Version: 0.10.0

## Problem

Besides inspections, the beekeeper records what they *did* to a hive: fed it, treated it, harvested, changed the queen, split it, caught a swarm, merged, moved it, lost it. Each has its own few facts, they share the hive timeline, and some of them change the hive itself (a new queen, a new apiary, a dead colony). Reviewers record events too, but cannot edit hives (B3 RLS).

## Decisions

### Event types and forms

One form per type, all built from field controls (`ChipSelect`, `StepperField`, `TriStateField`, big date button); keyboard only behind "Escribir". Shapes are exactly B4's `details`; Zod schemas in `src/features/events/schemas.ts` mirror `../beekeeper/docs/api.md` (one `z.object` per type, `.strict()` off so unknown server keys survive a pull).

| Type | Label | Icon | Form fields → `details` |
|------|-------|------|-------------------------|
| `feeding` | Alimentación | `droplet` | feed (chips: Jarabe, Fondant, Torta de polen, Miel, Otro) → `feed`; amount stepper (0.5 steps) → `amount`; unit chips l / kg / g → `unit`; ratio chips 1:1 / 2:1 (only for syrup) → `ratio` |
| `treatment` | Tratamiento | `syringe` | product (text + last 5 used as chips) → `product` (required); active ingredient → `active_ingredient`; dose (text) → `dose`; method chips Tira / Goteo / Vapor / Espolvoreo / Otro → `method`; withdrawal days stepper → `withdrawal_days`; end date → `ends_on` |
| `queen_change` | Cambio de reina | `crown` | year stepper (default current year) → `queen_year`; color (suggested from year, B3 code) → `queen_color`; origin chips → `queen_origin`; reason chips Fallando / Agresiva / Perdida / Planificado → `reason` |
| `harvest` | Cosecha | `package` | product chips Miel / Polen / Propóleo / Cera → `product` (required); kg stepper (0.5 steps) → `kg` (required); supers taken stepper → `supers_taken` |
| `split` | División | `git-fork` | "Crear la nueva colmena ahora" (owner) → `new_hive_id` |
| `swarm` | Enjambre | `wind` | Captured Sí/No → `captured` (required); if captured and owner: "Crear la colmena del enjambre" → `new_hive_id` |
| `merge` | Unión | `merge` | pick the hive merged into this one (list of the apiary's active hives) → `merged_hive_id` |
| `transfer` | Traslado | `truck` | destination apiary (big list) → `to_apiary_id`; `from_apiary_id` filled automatically |
| `loss` | Pérdida | `skull` | cause chips Hambre / Plagas / Enfermedad / Fuga / Pesticida / Desconocida → `cause` |
| `note` | Nota | `sticky-note` | already built in M7 (field-mode notes); here only the "Nota" entry from hive detail |
| `qr_relabel` | Cambio de etiqueta | `qr-code` | **system-only**, written by M5 re-label; not offered in the picker |

Every event: `occurred_at` (default now, big "Hoy / Ayer / Elegir fecha" buttons), optional `inspection_id` when started from field mode.

### Effects on the hive (same local transaction as the event)

| Event | Owner | Reviewer |
|-------|-------|----------|
| `queen_change` | Updates `hives.queen_year`, `queen_color`, `queen_origin`, `queen_marked` | Event only + banner "Avisa al propietario para actualizar la reina de la colmena." |
| `transfer` | Updates `hives.apiary_id` | Event only + "Avisa al propietario…" (the hive stays in its apiary until the owner moves it) |
| `loss` | Offered: "¿Marcar la colmena como Muerta / Fugada / Inactiva?" (choice in the form, not a dialog) → `hives.status` | Event only + "Avisa al propietario…" |
| `merge` | Offered: set the merged hive's `status = 'merged'` | Event only |
| `split`, `swarm` (captured) | "Crear la nueva colmena" opens the M4 hive form prefilled (same apiary, `colony_origin = 'split'` / `'swarm_capture'`, `colony_started_on = today`) then the M5 QR assignment; the new hive's id goes into `new_hive_id` | Event without `new_hive_id`; banner "El propietario debe registrar la nueva colmena." |

The event row and the hive update are written in one SQLite transaction and queued as two outbox entries (event first, hive second). Server-side they are two upserts (not atomic); if the hive update fails (e.g. the user lost the owner role) it shows **Requiere atención** and the event is still kept.

### Entry points

- Hive detail (M6): "Registrar actividad" button → type picker (2-column grid of 96-dp tiles with icon + label, same look as the field action grid).
- Field mode (M7): a **"Actividad"** tile in the action grid → same picker, the event gets the current `inspection_id`, returns to field mode on save.
- Timeline (M6): events render with their icon and the one-line summary (`src/features/events/summary.ts`, Spanish, mirrors the admin's `event-summary.ts`).

### Edit and delete

Author or owner (B4 RLS): tap the event in the timeline → same form → save; delete = soft delete with undo. Hive effects are **not** reverted automatically on delete (the owner edits the hive); the form says so.

## Rejected

- A single generic form with all fields: too many controls on one screen with gloves.
- Applying hive effects on the server with a trigger: reviewers would gain a hidden write the RLS denies them, and B4 explicitly keeps events side-effect free.
- Reviewer-created hives for splits/swarms: default decision 1 in `../beekeeper/docs/ROADMAP.md` (only owners create hives).

## Security constraints

The UI hides hive effects for reviewers to mirror RLS; the server refuses them anyway (B3). Zod validates every form before it reaches SQLite; the DB checks (`type`, `details` size, `note.text`) are the backstop.

## Field use

- Every form fits one screen at 1.0 font scale or scrolls with big controls only; save button 72 dp at the bottom.
- Steppers for amounts and kg (no keyboard with gloves); last-used treatment products as chips.
- Fully offline, including creating the new hive for a split (QR from M5 works offline).

## Backend contract used

B4: `hive_events` (`id`, `organization_id`, `hive_id`, `inspection_id`, `type`, `occurred_at`, `details`, common columns) and the `details` shapes per type. B3: `hives` columns `apiary_id`, `status`, `queen_year`, `queen_color`, `queen_origin`, `queen_marked`, `colony_origin`, `colony_started_on`; owner-only writes. B1: outbox and error conventions.

## Out of scope

Treatment withdrawal reminders, harvest totals and statistics, inventory of feed/treatments, batch events for many hives at once (later: "Alimentar todo el apiario").
