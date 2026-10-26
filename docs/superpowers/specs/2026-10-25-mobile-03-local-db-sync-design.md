# M3 · Local database and sync engine — spec

Date: 2026-10-25 · Branch: `feat/m3-local-db-sync` · Status: **awaiting OK** · Version: 0.3.0

## Problem

The overview's hardest promise: an inspection recorded in airplane mode survives closing the app, syncs once when signal returns, and is never lost or duplicated, even if the network drops mid-sync. The user must always see what is pending and what failed.

## Decisions

### SQLite is the UI's source of truth

- `expo-sqlite`, one database file `landak.db`, WAL mode, `foreign_keys = ON`.
- Screens read only local tables. Every local write goes through `src/db/write.ts`, which in **one transaction** upserts the row and inserts/updates its outbox entry. "Guardado en este dispositivo" is shown only after that transaction commits.
- Screens refresh through `addDatabaseChangeListener` (`enableChangeListener: true`): `useLocalQuery(sql, params, tables)` re-runs when one of its tables changes. No ORM.
- Rejected: Drizzle ORM (another layer and its own migration tooling for ~6 tables), WatermelonDB (own sync protocol, conflicts with ours), PowerSync / ElectricSQL (external service; backend spec B1 already rejected them).

### Local migrations

`src/db/migrations/`: one file per step (`0001_initial.ts`, `0002_inspection_drafts.ts`, …, each exporting a SQL string) and `index.ts` with the ordered array. Every later module that changes the local schema adds a file here (M7, M9, M11 do). At startup, in one transaction: read `PRAGMA user_version`, run every step after it, set `user_version` to the array length. A step is never edited after release; a change is a new step. This is what makes APK updates safe for local data (M12 checks it again).

Tests: `expo-sqlite` does not run under Jest, but the SQL is plain SQLite, so `src/db/test-db.ts` wraps Node's built-in `node:sqlite` (Node 22.13+, no dependency) behind the small subset of the `expo-sqlite` API the app uses (`execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`). `migrations.test.ts` runs every step on an empty database and checks the final tables; an append-only snapshot of step hashes fails if a released step is edited or removed. The same adapter backs every test that needs a database (M6 timeline, M7 finish, M12 fixtures). If `node:sqlite` cannot load under `jest-expo`, the plan's first task says so and asks for `better-sqlite3` as a dev dependency instead.

### Local tables

Mirrors of the server tables with the same column names and types mapped to SQLite (`uuid`/`timestamptz`/`date` → `TEXT` ISO 8601, `numeric` → `REAL`, `boolean` → `INTEGER 0/1`, `text[]`/`jsonb` → `TEXT` JSON):

| Local table | Server table (beekeeper) | Columns |
|-------------|--------------------------|---------|
| `apiaries` | `apiaries` (B3) | every column |
| `hives` | `hives` (B3) | every column |
| `inspections` | `inspections` (B4) | every column |
| `hive_events` | `hive_events` (B4) | every column |
| `photos` | `photos` (B5) | every column (M9 adds its local file columns in its own migration) |
| `members_cache` | `my_memberships()` (B2) | `organization_id`, `organization_name`, `role` |
| `profiles_cache` | `profiles` (B2) | `id`, `email`, `display_name`, `deactivated_at`, `updated_at` (author names in the timeline offline) |
| `outbox` | — | see below |
| `sync_state` | — | PK (`organization_id`, `table_name`), `cursor` (ISO), `initial_pull_done` 0/1, `last_pull_at`, `last_error`; `profiles` uses `organization_id = ''` |

Drafts are M7's own local table (`inspection_drafts`), not part of this module.

Local-only columns on mirrored rows: `_dirty INTEGER` (1 while an outbox entry exists). Pulled rows never overwrite a row with `_dirty = 1` (the local edit wins until it is pushed; then the server's row comes back in the next pull).

### Local cascade (mirror of B4)

The server soft-deletes an inspection's linked `hive_events` and `photos` in the same write. `saveRow` does the same locally when it soft-deletes an inspection (children get `deleted_at`, `_dirty`, and an outbox entry), so screens agree before the next pull. Children of a soft-deleted **hive** are not touched (B5: history is kept); screens hide them by joining on `hives.deleted_at is null`.

### Outbox

```text
outbox (
  id TEXT PRIMARY KEY,             -- uuid
  table_name TEXT NOT NULL,        -- apiaries | hives | inspections | hive_events | photos
  row_id TEXT NOT NULL,
  op TEXT NOT NULL DEFAULT 'upsert',
  payload TEXT NOT NULL,           -- JSON of the server columns at the time of the write
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT,                 -- Spanish message for the UI
  last_error_code TEXT,            -- detail / HTTP status
  state TEXT NOT NULL DEFAULT 'pending',   -- pending | failed_permanent
  created_at TEXT NOT NULL,
  UNIQUE (table_name, row_id)      -- a second edit of the same row replaces the payload (coalescing)
)
```

- **Coalescing:** editing a row that already has a pending entry replaces its payload (one push per row, latest state).
- **Order:** two phases. (1) Every entry whose payload has `deleted_at = null`, parents first by table rank (`apiaries` → `hives` → `inspections` → `hive_events` → `photos`), then `created_at`, so a hive never arrives before its apiary. (2) Every entry whose payload sets `deleted_at`, in **reverse** rank (children first). Reason: B3/B4 check the parent in a `BEFORE INSERT` trigger, which fires on every upsert, so a child pushed after its parent's deletion fails with `parent_mismatch`, and an apiary is refused (`apiary_not_empty`) while its hives are still live on the server. Deleting a hive that has inspections still in the outbox therefore uploads them first, then deletes the hive.
- **Push:** `supabase.from(table).upsert(payload, { onConflict: 'id' })`, one row per request (simple, and a failure blames one row). Server-owned columns (`created_by`, `updated_at`, `created_at`) are stripped from the payload; the server sets them (B3 `force_author`, `set_updated_at`).
- **Success:** delete the outbox entry, clear `_dirty`, write back the returned row (`select()` after upsert) so `updated_at` is the server's.
- **Retryable failure** (network, timeout 15 s, 5xx, 401, 429; a 401 first tries one session refresh; a refresh refused for good ends the session as in M2 and pushing pauses until the same user signs in again): `attempts += 1`, `next_attempt_at = now + backoff[attempts]` with backoff 5 s → 30 s → 2 min → 10 min (cap, repeats every 10 min forever; the data is never dropped).
- **Permanent failure** (PostgREST 4xx except 401/408/429, or Postgres `P0001` / check / unique violation): `state = 'failed_permanent'`, `last_error = messageFor(error)` (M2 `errors.ts`). The row shows **Requiere atención**; the user opens it from Pendientes and can edit the record (which re-queues it as `pending`) or discard the local change ("Descartar cambio" restores the last server version on the next pull; a record that never reached the server is soft-deleted locally after an undo window).
- **Single flight:** one sync run at a time (module-level promise); a trigger during a run sets `rerun = true` and the run loops once more at the end. No overlapping runs, no infinite loop (the rerun flag is consumed once per run).
- Photos are pushed by M9's uploader (file → thumbnail → row); M3 provides the outbox entry types and the ordering slot.

### Pull

`members_cache` is refreshed first, from `my_memberships()`, on every run. Then, **per organization in `members_cache`** and per table in parent-first order:

```text
select * from <table>
where organization_id = :org and updated_at > :cursor(org, table)
order by updated_at, id limit 500
```

repeated until a page has fewer than 500 rows (cap: 40 pages per table per run, then continue next run — no list walked whole). Each page is upserted locally in one transaction (skipping `_dirty` rows). New cursor = last row's `updated_at` minus 2 minutes (overlap for late commits; duplicates are harmless upserts). A new organization starts at cursor `1970-01-01`; when its last table finishes a short page, `initial_pull_done = 1` (M6 reads it).

Why per organization: a cursor shared by all organizations would skip the whole history of an organization joined later (an invite code, or the admin adding the person, A7), because its rows are older than the cursor. The `organization_id` filter also keeps out rows RLS still returns for a soft-deleted organization (`my_memberships()` hides it, B2; RLS on its rows does not).

Memberships are hard-deleted and not in the cursor pull (`api.md` → Organizations): if an organization disappeared from `my_memberships()` (removed by an owner or the admin, left from another phone, or soft-deleted), its local rows and `sync_state` rows are deleted, except rows with pending outbox entries, which become `failed_permanent` with "Ya no tienes acceso a esta finca.". A changed `role` takes effect in the UI at once.

`profiles_cache` pulls `profiles` (RLS: yourself and co-members) with its own cursor. When `members_cache` gains an organization, the `profiles` cursor is reset to `1970-01-01` (the new co-members' profiles are older than it; the table is tiny).

### Triggers

| Trigger | Behaviour |
|---------|-----------|
| App start (after migrations) | full run |
| Network back (`expo-network` listener: `isInternetReachable` false → true) | full run |
| Local write | push-only run, debounced 3 s |
| Foreground timer | full run every 2 min while the app is active; stopped in background |
| Pull-to-refresh in Pendientes / lists | full run |

No sync on every keystroke; drafts (M7) are local only until "Terminar".

### Pendientes tab

- Header: global state chip (`SyncChip`): "Sincronizado" / "Pendiente de sincronizar (N)" / "Sin conexión — N guardados en este dispositivo" / "Requiere atención (N)".
- "Sincronizar ahora" button (56 dp).
- List grouped: **Requiere atención** first (record title, Spanish reason, "Revisar" / "Descartar cambio"), then **Pendientes** (title, "Intento 3 · próximo en 2 min"). Title from table: hive name, "Revisión de C-12 · 25 oct", "Nota · C-12"…
- Last successful sync time ("Última sincronización hace 4 min").
- Tab badge = pending + attention count.

### Wipe

`wipeLocalData()` registered in `src/lib/wipe.ts` (M2): closes the database, deletes `landak.db` (+ WAL files), resets the sync module state.

## Field use

Nothing in field mode waits for the network: writes commit locally in milliseconds; the only network-related UI in the field is the sync chip in the header. Sync runs in the background of the JS thread and never blocks a screen. Mobile data: domain rows sync on any connection (they are tiny); photos follow M9's Wi-Fi rule.

## Security constraints

- The local database holds only organizations the user belongs to (pull is RLS-filtered; removed organizations are purged).
- Sign-out wipes it. Device loss: data at rest is protected by Android's file-based encryption; SQLCipher is out of scope for V1 (noted as a later option).
- The outbox never stores tokens.

## Backend contract used

B1 conventions (client UUIDs, server-owned `updated_at`, soft delete via `deleted_at`, pull query and 2-minute overlap, push backoff, error `details` codes); tables `apiaries`, `hives` (B3), `inspections`, `hive_events` (B4), `photos` (B5), `profiles` (B2, plus `deactivated_at` from A7) with their columns as specified there; RPC `my_memberships()` (B2, excludes soft-deleted organizations); B4's server-side cascade of an inspection's soft delete; the `check_parent` / `apiary_not_empty` triggers that drive the push order.

## Out of scope

Background sync while the app is closed (`expo-background-task`, later spec), conflict UI beyond last-write-wins (ceiling from the backend: two owners editing the same hive offline lose one edit), SQLCipher, photo upload (M9).
