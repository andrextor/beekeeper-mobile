# M9 · Photos — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-09-photos-design.md` · Branch: `feat/m9-photos` · Status: **awaiting OK**

New dependencies (approval asked here, installed with `pnpm expo install`): `expo-camera` (already present from M5 for QR — reused), `expo-image-picker`, `expo-image-manipulator`, `expo-file-system` (if not already present).

1. **Local schema** — `src/db/migrations/0003_photos_local.ts`: local columns `local_main_uri`, `local_thumb_uri`, `upload_step`, `last_viewed_at` on `photos`; `settings` table, key `photos_on_mobile_data`.
   Check: migration test on the M3 test database from `user_version` 2.
2. **Processing** — `src/features/photos/process.ts` (`processPhoto(uri, ctx) → { id, mainUri, thumbUri, width, height, bytes }`), `src/features/photos/save.ts` (transaction: row + outbox), `process.test.ts` (path naming, dimensions math).
3. **Camera screen** — `src/app/hive/[id]/camera.tsx`, `src/components/field/ShutterButton.tsx` (if not already in M1), `src/features/photos/CameraStrip.tsx`, permission explainer screen `src/features/photos/CameraPermission.tsx`.
4. **Gallery import** — `src/features/photos/pickFromGallery.ts`; "Desde la galería" button on the camera screen.
5. **Upload job** — `src/features/sync/push-photos.ts` (resumable by `upload_step`, `upsert: true`, ordering after rows), `push-photos.test.ts` (resumes at each step, `403` → attention, `parent_mismatch` → dropped with its files, `5xx` retried, a photo deleted before upload drops its files and entry).
6. **Network policy** — `src/features/sync/network-policy.ts` (`canUploadPhotos(state, setting)`) + test; Perfil toggle "Subir fotos con datos móviles"; Pendientes "N fotos esperando Wi-Fi" + "Subir ahora con datos".
7. **Viewing** — `src/features/photos/useSignedUrls.ts` (batched, 50-min refresh), `PhotoGrid.tsx`, `PhotoViewer.tsx` (`src/app/photo/[id].tsx`), Fotos tab on hive detail, thumbnails in expanded inspections.
8. **Caption and delete** — caption editor in the viewer, soft delete with undo.
9. **Eviction** — `src/features/photos/evict.ts` (30 days / 500 MB, never unsynced) + `evict.test.ts`; run after sync and at start.
10. **Release** — `chore(release): 0.9.0`. Check: `pnpm ci:check`.

## How Iván tests it

1. Real phone, local or remote backend, signed in as owner. Open C-01 → Nueva revisión → **Foto** → allow camera → take 3 photos with gloves on → Listo.
2. Airplane mode on: take 2 more. Timeline shows all 5 from the phone; Pendientes says "5 fotos esperando…".
3. Airplane off, on mobile data: photos stay pending ("esperando Wi-Fi"); rows sync. Tap "Subir ahora con datos" → uploaded.
4. Kill the app in the middle of an upload (toggle airplane mode during it), reopen → it resumes; Studio → Storage shows exactly one `.jpg` + one `.thumb.jpg` per photo, `photos` table one row each.
5. Admin (A5) → C-01 → Fotos: same photos, thumbnails in the grid.
6. As reviewer on a second phone: the photos appear after sync, thumbnail first, full image on tap.
7. Delete one photo → undo → it stays; delete again → gone from the timeline, still in Storage.
