# M9 · Photos: capture, resize, thumbnail, queue, upload, view — spec

Date: 2026-10-25 · Branch: `feat/m9-photos` · Status: **approved** (Iván, 2026-10-26) · Version: 0.9.0

## Problem

During an inspection the beekeeper photographs frames, brood, queen cells and pests, with gloves on and usually without signal. A photo must never be lost once the shutter is pressed, must upload later without duplicating, must cost little mobile data, and must be visible on the hive's timeline both on the phone and in the admin.

## Decisions

### Capture

| Source | How | Why |
|--------|-----|-----|
| Camera (default) | In-app `expo-camera` `CameraView` with a 96-dp `ShutterButton` at the bottom center, a 72-dp "Listo" button, flash toggle 56 dp | The system camera's controls are too small for gloves, and returning from it can kill the app's state on low-memory phones |
| Gallery | `expo-image-picker` `launchImageLibraryAsync` (multiple, max 10) | Photos taken earlier with the phone's camera |

- Opened from the field-mode **Foto** tile (M7) → the photo is linked to the current inspection (`inspection_id`), or from the hive detail (M6) → `inspection_id = null`.
- Burst friendly: the camera stays open after each shot; a strip of the last thumbnails sits above the shutter; "Listo" closes it.
- Each shot: success haptic + counter "3 fotos". No preview/confirm step (no dialogs mid-inspection); a wrong photo is removed later from the strip with undo.

### Processing (in this order, before anything else)

1. Generate `id` (uuid v4).
2. `expo-image-manipulator`: resize long side to **1600 px**, JPEG **0.7** → `photos/<id>.jpg`; resize to **320 px**, JPEG 0.7 → `photos/<id>.thumb.jpg`. Both written to `FileSystem.documentDirectory` (not cache: Android may wipe the cache dir).
3. Delete the camera's temporary original.
4. One SQLite transaction (`saveRow`, M3): insert the local `photos` row (`upload_step = 'none'`) + its outbox entry (`table_name = 'photos'`, `row_id = id`).
5. Toast "Guardado en este dispositivo".

If step 2 fails (out of storage), the toast says "No hay espacio en el teléfono para guardar la foto." and nothing is queued.

### Local `photos` row (mirror of B5 + local columns)

Server columns: `id`, `organization_id`, `hive_id`, `inspection_id`, `storage_path` (`{organization_id}/{hive_id}/{id}.jpg`), `taken_at`, `width`, `height`, `bytes` (main file), `caption`, `created_by`, `created_at`, `updated_at`, `deleted_at`.
Local only, added by migration `src/db/migrations/0005_photos_local.ts` (0003 and 0004 went to M6 and M8): `local_main_uri`, `local_thumb_uri`, `upload_step` (`none` | `main` | `thumb` | `row`), `last_viewed_at`. The same migration creates `settings (key text primary key, value text not null)` (first key: `photos_on_mobile_data`). A photo is synced when `upload_step = 'row'` and it has no outbox entry; there is no separate sync-state column.

### Upload job (in the sync engine's pusher, `src/features/sync/`)

Order per photo, resuming from `upload_step`:

1. `storage.from('hive-photos').upload(storage_path, main, { contentType: 'image/jpeg', upsert: true })` → `upload_step = 'main'`.
2. Same for `<id>.thumb.jpg` → `upload_step = 'thumb'`.
3. Upsert the `photos` row by `id` → `upload_step = 'row'`, outbox entry deleted (M3 success path).

`upsert: true` makes a retried upload overwrite instead of failing (B5 update policy: `owner_id = auth.uid()`). The row is written last, so the server never has a row without a file. Once the row exists the files cannot be replaced (Storage `403`), which is why a later edit of the photo (caption, delete) pushes the row only. Backoff and "requires attention" follow the B1 rules; a 4xx from Storage (`403`: the hive was deleted or the user left the organization while the photo was queued; `413` too large) and `parent_mismatch` on the row mark the photo **Requiere atención** with the reason; `parent_deleted` on the row follows M3: a photo that never reached the server (`upload_step` before `row`) shows Requiere atención and keeps its local files; an edit of an uploaded photo (caption, delete) is dropped; network, `5xx` and `429` are retried.

A photo soft-deleted (undo strip, or the M3 cascade of its inspection) while `upload_step = 'none'` never reached the server: its outbox entry and local files are dropped instead of uploading files for a deleted row.

Photos upload **after** the inspection and event rows of the same batch (M3 rank), because `inspection_id` must exist server-side.

### Photos of an unfinished inspection (with M7 drafts)

A photo taken in field mode points at the draft's id, which is no inspection row until Terminar. The pusher's M3 wait rule gains one case: a photo whose `inspection_id` has **no local row** waits (no attempt counted) instead of earning `parent_mismatch`. Terminar makes the row and the photos follow. **Deshacer** of Terminar keeps the photos (M3's local removal skips `photos`; they wait again with the restored draft). **Descartar** a draft (after its undo window) removes its photos: rows, outbox entries and files. M3's local removal of a never-synced record also deletes the files of the photos it removes. Photos of a deleted hive are hidden like its other children.

### Network policy

- Default: photos upload only on **Wi-Fi** (`expo-network` `getNetworkStateAsync().type === WIFI`). Rows (inspections, events, notes) sync on any connection.
- Setting in Perfil: **"Subir fotos con datos móviles"** (off by default), stored in the local `settings` table.
- Pendientes tab shows "4 fotos esperando Wi-Fi" with a one-time button **"Subir ahora con datos"** (does not change the setting).

### Viewing

- Thumbnail strip on the hive screen (M6 has no tabs: a **Fotos** section above the history, "Ver todas" opens the grid `src/app/hive/[id]/photos.tsx`) and inside the inspection read view.
- Source order: local file if present → signed URL. Signed URLs: one `createSignedUrls(paths, 3600)` call per screen page (≤ 100 paths, thumbnails only in grids), kept in memory with their expiry; re-signed at 50 min.
- Full image: tap thumbnail → full-screen viewer with 56-dp close and next/previous buttons (no swipe required), caption, date, linked inspection; loads `<id>.jpg` (local or signed, on demand).
- Photos pulled from the server (taken by someone else) store only the row; files are fetched on view and the thumbnail is cached to `photos/<id>.thumb.jpg`.

### Caption and delete

- Caption optional (≤ 300), editable from the viewer ("Agregar descripción"), synced as a row update.
- Delete = soft delete (`deleted_at`) with undo snackbar; allowed for the author or an owner (B5 RLS). The file stays on the server (history).

### Local cache eviction

After a successful sync and at app start: keep every thumbnail; delete local **main** files of synced photos with `last_viewed_at` (or `taken_at`) older than **30 days**, or the oldest ones first while the `photos/` folder is over **500 MB**. Never evict a photo that is not synced (`upload_step ≠ 'row'` or an outbox entry exists).
`ponytail:` size-by-folder scan on each run, fine up to a few thousand files; keep a running total in `settings` if it gets slow.

## Rejected

- System camera via `launchCameraAsync`: small controls, activity restarts on low-memory phones.
- Uploading the original photo: 3–6 MB each, would burn the 1 GB free storage in ~250 photos and the beekeeper's data plan.
- Server-side thumbnails: Supabase image transformations are not in the free plan (B5).
- Background upload task (`expo-background-task`): Android kills it unpredictably; foreground sync triggers (AGENTS.md) are enough for V1.

## Security constraints

- Files live in the app's private document directory; signing out deletes `photos/` with the database (AGENTS.md): the photos module registers its own wipe (M2 `src/lib/wipe.ts`).
- No public URLs; signed URLs expire in 1 h and are never persisted to SQLite.
- The storage path always comes from the row's `organization_id` and `hive_id`, never from user input.

## Field use

- Shutter 96 dp, Listo 72 dp, all in the bottom third; works with the phone held in one hand.
- No confirmation after a shot; haptic + counter is the feedback.
- Works fully in airplane mode: capture, see in the strip, see in the timeline from the local file.
- Camera permission asked the first time the Foto tile is tapped, with a Spanish explanation screen before the system prompt: "Para tomar fotos de tus colmenas necesitamos usar la cámara."

## Backend contract used

B5: table `photos` (all columns above), bucket `hive-photos`, path `{organization_id}/{hive_id}/{photo_id}.jpg` + `.thumb.jpg`, 5 MB limit, `image/jpeg` only, `createSignedUrls`, upload order main → thumb → row. B4: `inspections.id` for `inspection_id`. B1: push/pull and error conventions.

## Out of scope

Annotating photos, video, R2, server-side orphan cleanup, sharing photos outside the app.
