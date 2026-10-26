# M10 · Events — plan

Spec: `docs/superpowers/specs/ok-2026-10-25-mobile-10-events-design.md` · Branch: `feat/m10-events` · Status: **approved** (Iván, 2026-10-26)

No new dependencies (Zod and field controls exist from M1/M7).

1. **Schemas** — `src/features/events/schemas.ts` (one Zod object per type, mirrors `../beekeeper/docs/api.md`, unknown keys kept) + `schemas.test.ts`; summaries already exist in `src/lib/event-summary.ts` (M6), extended only if a form adds a key.
2. **Save + hive effects** — `src/features/events/save.ts` (`saveEvent(event, effects, role)`: one `saveRows` transaction, two outbox entries in M3 rank order), `effects.ts` (which hive update each type implies, owner only) + `effects.test.ts` (reviewer never gets hive updates); M7's `DraftEvent` gains an optional `hivePatch` and `finish.ts` applies it in Terminar's transaction (owner only) + test.
3. **Type picker** — `src/features/events/TypePicker.tsx` (2-column tiles), route `src/app/hive/[id]/event/new.tsx`.
4. **Forms** — `src/features/events/forms/{Feeding,Treatment,QueenChange,Harvest,Split,Swarm,Merge,Transfer,Loss}Form.tsx`, shared `OccurredAtField.tsx`, `ReviewerNotice.tsx` ("Avisa al propietario…").
5. **Split/swarm new hive** — `src/app/hive/new.tsx` reads `origin` and `returnTo=event` params (prefill), and on save puts the new id in `src/lib/hand-back.ts`; the event form takes it on focus → `new_hive_id`.
6. **Entry points** — "Registrar actividad" on hive detail; "Actividad" tile in field mode (the event and its hive effect go into the draft, written at Terminar); timeline event rows open the edit form for their author or an owner.
7. **Edit and delete** — `src/app/hive/[id]/event/[eventId].tsx`, soft delete with undo.
8. **Release** — `chore(release): 0.10.0`. Check: `pnpm ci:check`.

## How Iván tests it

Run on the 0.9.1 development build (no new native module), after the M3–M9 phone pass.

1. Owner phone, airplane mode on. C-01 → Registrar actividad → Alimentación → Jarabe, 2 l, 1:1 → Guardar → timeline "Alimentación · Jarabe de azúcar 1:1 · 2 l".
2. Cambio de reina → year 2026 → color suggested "Blanco" → Guardar → hive header shows the new queen.
3. Traslado → La Loma → C-01 now listed under La Loma.
4. División → "Crear la nueva colmena ahora" → form prefilled → assign a QR → the new hive appears; the split event links to it.
5. Airplane off → Pendientes empties; Studio shows the events and the updated `hives` rows; admin A5 timeline shows them.
6. Reviewer phone: Pérdida on C-02 → banner "Avisa al propietario…"; after sync C-02 is still "Activa" and the loss event is visible to the owner.
7. From field mode: "Actividad" → Tratamiento → saved with the inspection linked (expanded inspection in the admin lists it).
