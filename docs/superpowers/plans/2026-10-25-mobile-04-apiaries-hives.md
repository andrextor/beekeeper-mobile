# M4 · Apiaries and hives — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-04-apiaries-hives-design.md` · Branch: `feat/m4-apiaries-hives` · Status: **awaiting OK**

New dependencies (approval asked here): `expo-location`, `@react-native-community/datetimepicker` (native date picker, via `pnpm expo install`). Both are native: like M3's, they wait for the single development build of the final phone pass (Iván, 2026-10-26).

1. **Schemas and helpers** — `src/features/apiaries/schema.ts`, `src/features/hives/schema.ts` (Zod, every B3 rule) + tests; `src/features/hives/queen-color.ts`, `next-name.ts` ("C-13", per apiary) + tests (age: M1's `formatColonyAge`); `src/lib/qr-code.ts` (`newQrCode()` moved from M3's `randomQrCode()` in `ids.ts`, `isQrCode()`) + `qr-code.test.ts` (alphabet, length, regex identical to B3); `src/lib/text.ts` (`fold()`: lowercase without accents, for search) + test.
2. **Local queries** — `src/features/apiaries/queries.ts` (list of the active finca with active hive counts and last inspection, detail), `src/features/hives/queries.ts` (by apiary with filter, `limit 500`, detail; hives of a deleted apiary never listed), all on M3's `useLocalQuery` + `fromLocal`.
3. **Apiarios tab and apiary detail** — `src/app/(tabs)/apiaries.tsx`, `src/app/apiary/[id]/index.tsx`, `ApiaryListItem.tsx`, `HiveListItem.tsx`, empty states per role.
4. **Apiary form** — `src/app/apiary/new.tsx`, `src/app/apiary/[id]/edit.tsx`, `ApiaryForm.tsx` (location button, soft delete with `apiary_not_empty` check, undo).
5. **Hive form** — `src/app/hive/new.tsx`, `src/app/hive/[id]/edit.tsx`, `HiveForm.tsx` (steppers, chips, queen color suggestion, live age).
6. **Hive facts** — `src/app/hive/[id]/index.tsx` header (`HiveFacts.tsx`); timeline placeholder for M6.
7. **Role gating and rejections** — `useRole()` in every owner action, edit-route guard; Pendientes card gets "Revisar" (`src/features/sync/PendingList.tsx`: apiary/hive entries → their edit route, `duplicate_name` highlights the name); automatic `qr_taken` regeneration for new hives in a `push.ts` hook (new code + `qr_relabel` event, re-queued) + test.
8. **Trim the M3 dev panel**: remove "Crear colmena de prueba" and the test hive list (real forms exist now); keep "Forzar error", outbox and cursors.
9. **Release** — `chore(release): 0.4.0`. Check: `pnpm ci:check`.

## How Iván tests it

Run in the final phone pass, on the single development build (Iván, 2026-10-26).


1. As `owner@landak.test`: Apiarios shows Vallecito 1 and La Loma (from the seed); open Vallecito 1 → 2 active hives, chip "Todas" → C-03 "Muerta".
2. **Airplane mode**, gloves on: "Nuevo apiario" "Vallecito 2" with "Usar mi ubicación" → "Nueva colmena" → name suggested "C-…", type with a chip, 1 cámara, 2 alzas, queen year 2026 → color suggested "Blanco" → save.
3. Kill and reopen the app offline → both records still there; Pendientes shows them pending.
4. Airplane mode off → synced; check in `beekeeper` admin or Studio.
5. Try to delete Vallecito 2 while its hive is active → blocked message.
6. Sign in as `reviewer@landak.test` → same lists, no "Nuevo"/"Editar" buttons.
7. Create a hive named "C-01" in Vallecito 1 (existing) while offline, go online → "Requiere atención" with "Ya hay una colmena con ese nombre en este apiario." → Revisar → rename → synced. A hive "C-01" in Vallecito 2 syncs fine (names are per apiary).
8. Studio: demote `owner@` to reviewer while the phone has an edited hive queued offline → go online → "Requiere atención" with the permission message; restore the role → Revisar → save again → synced.
