# M6 · Hive detail and timeline — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-06-hive-timeline-design.md` · Branch: `feat/m6-hive-timeline` · Status: **awaiting OK**

No new dependencies.

1. **Summaries** — `src/features/hives/summary.ts` (`inspectionSummary`, `eventSummary`) + `summary.test.ts` (every event type in `docs/api.md`, missing keys, unknown type, `not_checked`, max 4 parts).
2. **Attention** — `src/features/hives/attention.ts` (`hiveAttention(lastInspection, events, today)` → items: urgent/soon, overdue days, active treatment) + test (due today, overdue, treatment ending today counts as active).
3. **Timeline query** — `src/features/hives/timeline.ts` (two local queries, merge, cursor, notes grouped under their inspection, sync state per item) + test with an in-memory SQLite (`expo-sqlite` mock from M3 tests).
4. **Server fallback** — `src/features/hives/timeline-remote.ts` (`hive_timeline` RPC mapped to the same item type) and the switch on `initial_pull_done` + connectivity.
5. **Hive screen** — `src/app/hive/[id].tsx`, `src/features/hives/{HiveHeader,AttentionCard,LastInspectionCard,HiveFacts,TimelineList,TimelineItem}.tsx`, fixed "Nueva revisión" button (navigates to M7's route; until M7 lands it opens a placeholder).
6. **Inspection read view** — `src/app/inspection/[id].tsx`, `src/features/inspections/InspectionDetail.tsx`.
7. **Release** — `chore(release): 0.6.0`. Check: `pnpm ci:check`.

## How Iván tests it

1. `pnpm db:reset` on the backend (seed: C-01 has 3 inspections, feeding, treatment, notes). Sign in as owner on the phone, wait for sync.
2. Scan or open C-01: attention card, last inspection "hace … · por …", 4 facts, "Nueva revisión" at the bottom without scrolling.
3. Timeline shows inspections and events newest first; the voice inspection opens with its transcript; notes appear inside their inspection.
4. **Airplane mode**, kill and reopen the app → C-01 shows the same.
5. Fresh install signed in as the reviewer, turn on data, open C-01 before the first sync finishes → banner "Mostrando historial del servidor…"; after sync it disappears.
6. Create 35 events on a test hive (seed script or SQL) → "Cargar más" loads the rest; no duplicates.
7. With gloves: tap "Nueva revisión" and "Cargar más" on the first try.
