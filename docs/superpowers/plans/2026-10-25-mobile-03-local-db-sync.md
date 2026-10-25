# M3 · Local database and sync engine — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-03-local-db-sync-design.md` · Branch: `feat/m3-local-db-sync` · Status: **awaiting OK**

New dependencies (approval asked here): `expo-sqlite`, `expo-network`.

1. **Database and migrations** — `src/db/database.ts` (open, WAL, foreign keys, change listener), `src/db/migrations.ts` (step 1: every table in the spec), `src/db/migrate.ts` (`user_version` runner in a transaction), `migrations.test.ts` (append-only snapshot of step hashes).
2. **Row mapping** — `src/db/mapping.ts`: server row ↔ local row per table (booleans, arrays, JSON, server-owned columns stripped on push), driven by `supabase.types.ts`; `mapping.test.ts` round-trips one sample row per table.
3. **Local writes and queries** — `src/db/write.ts` (`saveRow(table, row)`: one transaction, row + coalesced outbox entry + `_dirty`), `src/db/useLocalQuery.ts`.
4. **Pusher** — `src/features/sync/push.ts`: ordering by table rank, single row upsert with 15 s timeout, error classification (`classify.ts` + `classify.test.ts`: network/5xx/429/401 retryable; 4xx/`P0001`/23505/23514 permanent), backoff table (`backoff.ts` + test: 5 s, 30 s, 2 min, 10 min cap).
5. **Puller** — `src/features/sync/pull.ts`: per-table cursor loop (500 rows, 40-page cap, 2-minute overlap, skip `_dirty`), `members_cache` replace + removed-organization purge, `profiles_cache`; `cursor.test.ts` for the overlap and cap logic.
6. **Engine and triggers** — `src/features/sync/engine.ts` (single flight + one rerun), `src/features/sync/triggers.ts` (start, reconnect, debounced 3 s after `saveRow`, 2-min foreground timer stopped by `AppState`), `useSyncStatus()`; `engine.test.ts` with fake push/pull: concurrent triggers run once + one rerun, never loop.
7. **Pendientes tab** — `src/app/(tabs)/pending.tsx`, `src/features/sync/PendingList.tsx`, tab badge, "Requiere atención" actions (Revisar → route of the record, Descartar cambio).
8. **Wipe and sign-out count** — register `wipeLocalData` in `src/lib/wipe.ts`; M2's sign-out sheet reads the real pending count.
9. **Debug panel (dev only)** — section in `_design.tsx`: outbox rows, cursors, "Forzar error" toggle that makes the next push fail, to test retries.
10. **Release** — `chore(release): 0.3.0`. Check: `pnpm ci:check`.

Until M4 exists there are no screens that write; the test uses the dev panel's "Crear colmena de prueba" button (creates an apiary + hive through `saveRow`), removed in M4.

## How Iván tests it

Backend local stack running, signed in as `owner@landak.test`.

1. Open the app → Pendientes says "Sincronizado"; the dev panel shows cursors for every table (the seed's Finca Landak rows were pulled).
2. **Airplane mode** → dev panel "Crear colmena de prueba" → toast "Guardado en este dispositivo"; Pendientes shows "Sin conexión — 2 guardados en este dispositivo".
3. Kill the app (swipe it away), reopen still in airplane mode → the 2 records are still pending.
4. Airplane mode off → within a few seconds Pendientes shows "Sincronizado"; in Studio (`beekeeper`) the apiary and hive exist **once**.
5. Turn on "Forzar error", create another test hive, wait: "Intento 2 · próximo en 30 s"; turn it off → it syncs.
6. In Studio, as another session, rename the test hive → pull-to-refresh in Pendientes → the new name shows locally.
7. Create a test hive with a name that already exists (dev panel field) → "Requiere atención" with the Spanish reason → "Descartar cambio" removes it.
