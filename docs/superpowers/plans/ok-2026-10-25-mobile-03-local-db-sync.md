# M3 · Local database and sync engine — plan

Spec: `docs/superpowers/specs/ok-2026-10-25-mobile-03-local-db-sync-design.md` · Branch: `feat/m3-local-db-sync` · Status: **approved** (Iván, 2026-10-26)

New dependencies (approved): `expo-sqlite`, `expo-network`. Both are native: they need a new development build, which waits for the single build of the phone pass at the end (Iván, 2026-10-26: phone tests run when the modules are done, not per module).

1. **Test database** — `src/db/test-db.ts` (`node:sqlite` behind the `expo-sqlite` subset the app uses) + `test-db.test.ts` (round trip, transaction rollback). If `node:sqlite` does not load under `jest-expo`, stop and ask for `better-sqlite3` (dev) before going on.
2. **Database and migrations** — `src/db/database.ts` (open, WAL, foreign keys, change listener), `src/db/migrations/0001_initial.ts` (every table in the spec) + `src/db/migrations/index.ts`, `src/db/migrate.ts` (`user_version` runner in a transaction), `migrations.test.ts` (runs on the test database; append-only snapshot of step hashes).
3. **Row mapping** — `src/db/mapping.ts`: server row ↔ local row per table (booleans, arrays, JSON, server-owned columns stripped on push), driven by `supabase.types.ts`; `mapping.test.ts` round-trips one sample row per table. `_dirty` and `_on_server` are in `0001_initial.ts` (pulled rows and push successes set `_on_server = 1`).
4. **Local writes and queries** — `src/db/write.ts` (`saveRow(table, row)`: one transaction, row + coalesced outbox entry + `_dirty`; soft-deleting an inspection cascades to its events and photos) + `write.test.ts` on the test database (coalescing, cascade), `src/db/useLocalQuery.ts`.
5. **Pusher** — `src/features/sync/push.ts`: two-phase order (live rows parent-first, then deletions child-first; `order.ts` + `order.test.ts`: hive deleted with a pending inspection pushes the inspection first, apiary deleted after its hives), single row upsert with 15 s timeout, error classification (`classify.ts` + `classify.test.ts`: network/5xx/429/401 retryable; other 4xx/`P0001`/`23505`/`23514`/`42501` permanent; `parent_mismatch` permanent; `parent_deleted` → dropped when `_on_server = 1`, permanent when `_on_server = 0`), backoff table (`backoff.ts` + test: 5 s, 30 s, 2 min, 10 min cap).
6. **Puller** — `src/features/sync/pull.ts`: `members_cache` refresh + removed-organization purge first, then per-organization, per-table cursor loop (`organization_id` filter, 500 rows, 40-page cap, 2-minute overlap, skip `_dirty`, `initial_pull_done`), `profiles_cache` with its reset on a new organization; `cursor.test.ts` (overlap, cap, a newly joined organization starts at 1970 while the others keep their cursor).
7. **Engine and triggers** — `src/features/sync/engine.ts` (single flight + one rerun), `src/features/sync/triggers.ts` (start, reconnect, debounced 3 s after `saveRow`, 2-min foreground timer stopped by `AppState`), `useSyncStatus()`; `engine.test.ts` with fake push/pull: concurrent triggers run once + one rerun, never loop.
8. **Pendientes tab** — `src/app/(tabs)/pending.tsx`, `src/features/sync/PendingList.tsx`, tab badge, "Requiere atención" action "Descartar cambio" with an undo toast. "Revisar" (route of the record) arrives with M4, the first module with record screens.
9. **Wipe and sign-out count** — register `wipeLocalData` in `src/lib/wipe.ts`; M2's sign-out sheet reads the real pending count.
10. **Debug panel (dev only)** — section in `_design.tsx`: outbox rows, cursors, "Forzar error" toggle that makes the next push fail, to test retries; "Crear colmena de prueba" (apiary + hive, optional name, optional inspection) and "Eliminar colmena de prueba".
11. **Release** — `chore(release): 0.3.0`. Check: `pnpm ci:check`.

Until M4 exists there are no screens that write; the test uses the dev panel's "Crear colmena de prueba" button (creates an apiary + hive through `saveRow`), removed in M4.

## How Iván tests it

Backend local stack running, signed in as `owner@landak.test`.

1. Open the app → Pendientes says "Sincronizado"; the dev panel shows cursors for every table (the seed's Finca Landak rows were pulled).
2. **Airplane mode** → dev panel "Crear colmena de prueba" → toast "Guardado en este dispositivo"; Pendientes shows "Sin conexión — 2 guardados en este dispositivo".
3. Kill the app (swipe it away), reopen still in airplane mode → the 2 records are still pending.
4. Airplane mode off → within a few seconds Pendientes shows "Sincronizado"; in Studio (`beekeeper`) the apiary and hive exist **once**.
5. Turn on "Forzar error", create another test hive, wait: "Intento 1 · se reintenta en un momento", then "Intento 2"…; turn it off → it syncs.
6. In Studio, as another session, rename the test hive → pull-to-refresh in Pendientes → the new name shows locally.
7. Create a test hive with a name that already exists (dev panel field) → "Requiere atención" with the Spanish reason → "Descartar cambio" removes it.
8. **Second organization:** sign in as `reviewer@landak.test`, let it sync; in Studio (impersonating `other@landak.test`, `a000-…03`) `select * from create_invite('00000000-0000-4000-b000-000000000002', 'reviewer');`; on the phone accept the code → after the next sync the dev panel shows "Apiario Ajeno" rows and their own cursors, Finca Landak's cursors unchanged.
9. **Removed:** in Studio `delete from organization_members where user_id = '00000000-0000-4000-a000-000000000002' and organization_id = '00000000-0000-4000-b000-000000000002';` → after the next sync that organization's rows are gone from the phone.
10. **Delete with pending children:** airplane mode → dev panel creates a test hive with one inspection, then deletes the hive → airplane off → Pendientes empties with no "Requiere atención"; Studio shows the inspection and the hive with `deleted_at`.
11. **Parent deleted elsewhere:** airplane mode → dev panel creates a test inspection on an existing test hive; in Studio soft-delete that hive (`update hives set deleted_at = now() where id = …`) → airplane off → the new inspection shows **Requiere atención** "El registro relacionado fue eliminado." (it was never saved, so it is not dropped). Then: a synced test hive with a synced inspection, airplane mode, edit the inspection's notes, soft-delete the hive in Studio, airplane off → Pendientes empties with no "Requiere atención" and the hive is gone from the phone.
