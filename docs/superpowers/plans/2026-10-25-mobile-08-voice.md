# M8 · Voice — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-08-voice-design.md` · Branch: `feat/m8-voice` · Status: **awaiting OK**

New dependency (approval asked here): `expo-speech-recognition` (config plugin in `app.json`, needs a new dev build; not available in Expo Go).

1. **Numbers and normalization** — `src/features/voice/normalize.ts` (accents, case, spaces, char map for spans), `numbers.ts` (Spanish words 0–99) + tests.
2. **Parser** — `src/features/voice/parser.ts` (clauses, negation, rules from the spec table, conflict resolution) + `parser.test.ts` with the cases below (table-driven; each case asserts the proposals and their spans' phrases).
3. **Recognition** — `src/features/voice/recognition.ts` (availability, permission, locale choice, on-device flag, restart cap 20, stop after 3 `no-speech`), `useDictation.ts` hook (state: idle / listening / stopped / error, interim + final text) + tests with a mocked module (locale choice order, offline without pack → `needs_offline_pack`, restart cap).
4. **Offline pack guide** — `src/features/voice/OfflinePackBanner.tsx` (Descargar on Android 13+, guide otherwise).
5. **Dictation sheet** — `src/components/field/DictationSheet.tsx`; Note sheet (M7) gets the Dictar button (`source: 'voice'`).
6. **Confirmation** — `src/features/voice/ConfirmProposals.tsx`, `applyProposals(draft, accepted)` in `src/features/voice/apply.ts` (merge into draft, `source = 'voice'`, transcript append, pending notes, feeding event in draft) + test.
7. **Wire field mode** — Dictar tile visible (M7 `FieldInspection.tsx`), `finish.ts` writes a draft `feeding` proposal as a `hive_events` row in the same transaction + test.
8. **Release** — `chore(release): 0.8.0`. Check: `pnpm ci:check`.

### Parser test cases (`parser.test.ts`, `today = 2026-11-01`, open hive `C-01`)

| # | Input | Expected proposals |
|---|-------|--------------------|
| 1 | "La reina no se vio" | `queen_seen = no` |
| 2 | "Reina vista" | `queen_seen = yes` |
| 3 | "Vi la reina" | `queen_seen = yes` |
| 4 | "No encontré la reina" | `queen_seen = no` |
| 5 | "No revisé la reina" | `queen_seen = not_checked` |
| 6 | "Hay buena postura" | `eggs_seen = yes` (medium) |
| 7 | "No hay huevos" | `eggs_seen = no` |
| 8 | "Sin larvas" | `larvae_seen = no` |
| 9 | "Tres cuadros de cría" | `brood_frames = 3` |
| 10 | "3 marcos de cría" | `brood_frames = 3` |
| 11 | "Doce cuadros de miel" | `honey_frames = 12` |
| 12 | "Veintiún cuadros de cría" | `brood_frames = 21` |
| 13 | "Dos cuadros de polen" | `pollen_frames = 2` |
| 14 | "Reservas bajas" | `stores = low` |
| 15 | "Pocas reservas" | `stores = low` |
| 16 | "Reservas buenas" | `stores = ok` |
| 17 | "Está llena de miel" | `stores = high` |
| 18 | "Fuerza cuatro" | `population_strength = 4` (high) |
| 19 | "Colmena muy débil" | `population_strength = 1` (medium) |
| 20 | "Fuerza 7" | nothing (out of range) |
| 21 | "Muy brava" | `temperament = 5` |
| 22 | "Estaba mansa" | `temperament = 2` |
| 23 | "Hay celdas reales" | `queen_cells = swarm` |
| 24 | "No hay realeras" | `queen_cells = none` |
| 25 | "Celdas de reemplazo" | `queen_cells = supersedure` |
| 26 | "Cría salteada" | `brood_pattern = spotty` |
| 27 | "Cría compacta" | `brood_pattern = compact` |
| 28 | "Vi polilla y hormigas" | `pests += wax_moth, ants` |
| 29 | "No hay escarabajo" | nothing for pests |
| 30 | "Algunas avispas" | `pests += wasps` |
| 31 | "Cría yesada" | `disease_signs += chalkbrood` (medium) |
| 32 | "Abejas con alas deformes" | `disease_signs += deformed_wings` |
| 33 | "Olor a podrido" | `disease_signs += foulbrood_signs` |
| 34 | "Siete varroas en el lavado" | `varroa_count = 7`, `varroa_method = alcohol_wash`, no sample size |
| 35 | "Cinco varroas en la lámina" | `varroa_count = 5`, `varroa_method = sticky_board` |
| 36 | "Revisar en ocho días" | `next_inspection_on = 2026-11-09` |
| 37 | "Volver en dos semanas" | `next_inspection_on = 2026-11-15` |
| 38 | "Revisar la próxima semana" | `next_inspection_on = 2026-11-08` |
| 39 | "En un mes" | `next_inspection_on = 2026-12-01` |
| 40 | "Es urgente" | `attention_level = urgent` |
| 41 | "Hay que alimentar" | `planned_actions = {feed}`, `attention_level = soon` |
| 42 | "Le di dos litros de jarabe" | `feeding_event { feed: sugar_syrup, amount: 2, unit: l }` |
| 43 | "Día soleado, veinticuatro grados" | `weather = sunny`, `temperature_c = 24` |
| 44 | "Está lloviendo" | `weather = rain` |
| 45 | "Colmena 12, la reina no se vio" | `hive_mismatch (12)`, `queen_seen = no` |
| 46 | "Colmena C-01, reservas bajas" | `stores = low`, no mismatch |
| 47 | "Reservas bajas, bueno no, reservas normales" | `stores = ok` (medium, last wins) |
| 48 | "La reina no se vio, hay buena postura, tres cuadros de cría, reservas bajas. Alimentar y revisar en ocho días." (overview example) | `queen_seen = no`, `eggs_seen = yes`, `brood_frames = 3`, `stores = low`, `planned_actions = {feed}`, `attention_level = soon`, `next_inspection_on = 2026-11-09` |
| 49 | "" | `[]` |
| 50 | "Todo bien hoy" | `[]` (stays in transcript only) |

## How Iván tests it

On a real Android phone with the new dev build:

1. Ajustes del teléfono: download the Spanish offline voice pack (or use the app's Descargar button). **Airplane mode on.**
2. Scan C-01 → Nueva revisión → **Dictar** (gloves on) → say the overview example (#48) → Detener.
3. Confirmation shows the transcript with highlighted phrases and 7 proposals; Quitar "Atención", Cambiar "Cuadros de cría" to 4 → Aceptar todo.
4. Field mode shows the values; Terminar → saved. Airplane mode off → synced; Studio: `source = voice`, `transcript` exactly as recognized, `brood_frames = 4`, `planned_actions = {feed}`.
5. Nota 1 → Dictar inside the note → "Falta una alza" → saved as note with `source: voice`.
6. Uninstall the offline pack, airplane mode on → Dictar shows the banner before listening; inspection still doable by taps.
7. Deny the microphone permission → "Necesitamos el micrófono…" + Abrir ajustes; taps still work.
8. Say "Colmena 12, reservas bajas" while on C-01 → warning about the mismatch, nothing switches.
