# M6 · Hive detail and timeline — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-06-hive-timeline-design.md` · Branch: `feat/m6-hive-timeline` · Status: **awaiting OK** (reviewed 2026-10-26 after M5)

No new dependencies.

1. **Summaries** — port `../beekeeper/admin/src/lib/inspection-summary.ts` (`inspectionSummary`, `inspectionFields`) and `event-summary.ts` (`eventSummary`) to `src/lib/` with their tests, adapting only the row types to the local ones (every event type in `docs/api.md`, missing keys, unknown type, `not_checked`).
2. **Attention** — `src/features/hives/attention.ts` (`hiveAttention(lastInspection, events, today)` → items: urgent/soon, overdue days, active treatment) + test (due today, overdue, treatment ending today counts as active).
3. **Timestamps and timeline query** — `src/db/mapping.ts` normalizes timestamp columns to `…mmmZ` (string rewrite) + `mapping.test.ts` cases (`+00:00` with 6, 1 or no fraction digits, already-`Z` values untouched); `src/features/hives/timeline.ts` (two local queries, merge, `(at, id)` cursor, notes grouped under their inspection, sync state per item) + test on the M3 test database (`src/db/test-db.ts`): an event and an inspection with the same timestamp across a page boundary appear once each.
4. **Server fallback** — `src/features/hives/timeline-remote.ts` (`hive_timeline` RPC with `p_before` + `p_before_id`, mapped to the same item type; `author_name = null` → "Antiguo miembro") and the switch on `initial_pull_done` + connectivity.
5. **Hive screen** — `src/app/hive/[id]/index.tsx` (extends M4; reuses M4's `HiveFacts` collapsed and the M4/M5 action buttons), `src/features/hives/{AttentionCard,LastInspectionCard,TimelineList,TimelineItem}.tsx`, fixed "Nueva revisión" bar opening `src/app/hive/[id]/inspect.tsx` (placeholder until M7).
6. **Inspection read view** — `src/app/inspection/[id].tsx`, `src/features/inspections/InspectionDetail.tsx`.
7. **Inicio** — `src/features/hives/home.ts` (`hivesToVisit`, `openTasks`) + `home.test.ts` (latest inspection only, tie by id, overdue today, deleted or non-active hive hidden); `src/app/(tabs)/index.tsx` with the three sections and the empty state.
8. **Release** — `chore(release): 0.6.0`. Check: `pnpm ci:check`.

## How Iván tests it

Run in the final phone pass, on the single development build (Iván, 2026-10-26).

1. `pnpm db:reset` on the backend (seed: C-01 has 3 inspections, feeding, treatment, notes). Sign in as owner on the phone, wait for sync.
2. Scan or open C-01: attention card, last inspection "hace … · por …", 4 facts, "Nueva revisión" at the bottom without scrolling.
3. Timeline shows inspections and events newest first; the voice inspection opens with its transcript; notes appear inside their inspection.
4. **Airplane mode**, kill and reopen the app → C-01 shows the same.
5. Fresh install signed in as the reviewer, turn on data, open C-01 before the first sync finishes → banner "Mostrando historial del servidor…"; after sync it disappears.
6. Create 35 events on a test hive (seed script or SQL) → "Cargar más" loads the rest; no duplicates.
7. With gloves: tap "Nueva revisión" and "Cargar más" on the first try.
8. Inicio as owner: C-01 appears under Tareas "Alimentar" (seed: latest inspection `{feed}`); C-03 (dead) or a deleted hive never appears. Delete a hive in Studio, sync → it disappears from Inicio and its history is hidden.
