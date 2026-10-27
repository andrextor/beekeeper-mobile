# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.3.1] - 2026-10-26

### Fixed

- A button that starts disabled (Ingresar, Cambiar rol…) no longer remounts when it turns on; in the dev build, typing the password on Iniciar sesión crashed with "Couldn't find a LinkingContext context".

## [1.3.0] - 2026-10-26

### Changed

- Every screen outside field mode opens with the dark honeycomb band (spec M15): Iniciar sesión, Crear cuenta, Tengo un código, Empecemos, Apiarios, Pendientes, Perfil, fincas, Personas, Invitar, apiary and hive forms, Etiqueta QR, Fotos, Cambiar etiqueta, Revisión and activities. Lists scroll the band away; long titles moved their context (hive, finca) to the small line above.
- "¿Olvidaste tu contraseña?" is a link, like "Crear cuenta" (shared `TextLink`).
- App icon and splash use the honeycomb mark in honey on the deep band color, replacing the placeholder hexagon. Needs a new APK.

## [1.2.1] - 2026-10-26

### Fixed

- Invite sharing (review of 1.2.0): **Compartir de otra forma** keeps the share menu (SMS, correo…) reachable when WhatsApp is installed; a double tap no longer opens two chats; a failed share shows a message instead of failing silently. The WhatsApp helper moved to `src/features/members/share.ts` with a test.

## [1.2.0] - 2026-10-26

### Added

- Read-only role **Observador** (`viewer`, backend B8): it reads the whole finca and records nothing. Nueva revisión, Registrar actividad, Tomar foto, editing, deleting and photo descriptions are hidden; write routes opened directly say "Como observador puedes ver la finca, pero no registrar cambios."; the outbox refuses its writes as a second net behind RLS.
- Invitar persona and the person sheet offer three roles (Propietario, Revisor, Observador) with one line each; the sheet's "Hacer revisor / propietario" toggle becomes chips plus **Cambiar rol**.

### Changed

- **Compartir por WhatsApp** opens WhatsApp with the invite message; without WhatsApp it falls back to the share menu.
- The honeycomb behind the dark bands is visible (opacity 16 %).
- `docs/install.md`: invite codes last 30 days (set by the server).

### Fixed

- A role the app does not know no longer blanks the fincas or the Personas list: it reads as Observador (least privilege).

## [1.1.1] - 2026-10-26

### Fixed

- Buttons and pressable cards lost their background, size and centring on Android (Bienvenida showed "Iniciar sesión" as bare text): the press effect is now NativeWind `active:` classes (sinks to 97 %) instead of a Reanimated wrapper.
- React Native's "ImageBackground is deprecated" notice, raised while NativeWind loads, no longer floods the Metro log (`index.js` entry, development only).

### Changed

- `docs/phone-pass.md` matches the redesigned app: Spanish setup steps, Iniciar sesión and the Crear cuenta link, sign-out from Empecemos, exact labels, a second finca added through Studio, mobile-data photos moved to the APK pass.

## [1.1.0] - 2026-10-26

### Changed

- Visual refresh "Panal" (M13): cards float on soft shadows over a warm canvas instead of grey-bordered boxes; pill buttons with a spring press (`secondary` is now tonal green, new `ghost` for Cancelar); filled text fields with the label inside, a green focus ring and errors with an icon; form messages are tinted callouts.
- Bienvenida: dark honeycomb band, **Iniciar sesión** leads and **Crear cuenta** is a link; the sign-in screen is titled "Iniciar sesión".
- Inicio and the hive ficha open on a `deep` band with the honeycomb pattern; screen titles are one `Title` component at 30 sp.
- Tab bar with a shadow, a Material pill behind the active tab and a raised scan button; the "Guardado… Deshacer" toast is a dark snackbar that slides up.
- Lists show their icon on a tinted tile; empty, error and database states sit in a honeycomb cell; badges and sync chips are tonal; field choices are filled and spring under the glove.
- Sign-up checks the password length when the field is left and clears the message once it is long enough.

## [1.0.0] - 2026-10-26

### Added

- Over-the-air fixes with `expo-updates` (channels `preview` and `production`, runtime by native fingerprint): Inicio shows **Hay una actualización → Reiniciar ahora**, never restarting by itself.
- **Hay una nueva versión de la app → Descargar** on Inicio when `latest.json` of `andrextor/beekeeper-releases` lists a newer APK; the invite message carries the same stable APK link.
- **No pudimos actualizar los datos** screen with **Enviar respaldo** when the local database cannot migrate after an update (the failed step rolls back and the file is shared as is).
- A test that walks every local migration from version 1 with unsent rows and an open draft.
- `pnpm release:apk [--cloud]`: builds the preview APK, writes `latest.json` and publishes the GitHub release with the CHANGELOG notes; `pnpm release:ota "…"` publishes a JS-only fix with the D1 values, never the local `.env`.
- `docs/install.md` (beekeepers), `docs/release.md` (publishing, keystore backup, OTA rules), pilot checklist in `docs/phone-pass.md`.

### Changed

- `eas.json`: `preview` APK and `production` AAB profiles against the live backend (D1); Android `versionCode` 3.
- Storage and overlay permissions are blocked: the gallery uses the system photo picker.

## [0.11.0] - 2026-10-26

### Added

- **Personas de la finca** (Perfil): members with role, "Tú" and "Desactivado"; owners see unused codes with **Cancelar código**, change roles and remove people (second step in the sheet).
- **Invitar persona**: optional label and role → a single-use code shown once, shared with **Compartir por WhatsApp**.
- **Salir de esta finca**: warns with the finca's unsent changes, then the next sync purges it and switches finca.
- `docs/phone-pass.md` gains the M11 row.

### Fixed

- Losing a finca also deletes its photo files from the phone, not only the rows.

## [0.10.0] - 2026-10-26

### Added

- `docs/phone-pass.md` gains the M10 row.
- **Registrar actividad** on the hive screen and an **Actividad** tile in field mode: feeding, treatment (last products as chips), harvest, queen change (colour suggested from the year), split, swarm, merge, transfer, loss and notes, each a taps-first form with Hoy / Ayer / Otra fecha.
- Owners' events update the hive in the same transaction: the new queen, the destination apiary, the status after a loss (their choice in the form), the merged hive marked Unida. Reviewers see "Avisa al propietario…".
- Split and captured swarm: **Crear la nueva colmena ahora** opens the hive form prefilled (same apiary, origin, started today) and links the new hive to the event.
- From field mode the event and its hive effect wait in the draft and are written at **Terminar**; **Deshacer** puts the hive back.
- Events in the history open their form for their author or an owner: edit, or delete with undo (hive effects are not reverted, the form says so).

### Changed

- Queen colour suggestion and calendar-day helpers moved to `src/lib/` (`queen-color.ts`, `dates.ts`, `pick-day.ts`); `src/lib/hand-back.ts` hands a value back to the screen that opened another.

## [0.9.1] - 2026-10-26

### Changed

- Android `versionCode` 2 for the development build that carries every native module so far; the development profile builds only `arm64-v8a` (about half the cloud build time).
- `docs/phone-pass.md`: the phone test sheet (order and essentials) for M2 steps 8–9 and M3 onwards, run once when the modules are done.

## [0.9.0] - 2026-10-26

### Added

- Photos: in-app camera with a 96-dp shutter for bursts (no confirmation, a counter and a strip of the shots; tap one to remove it with undo), flash, **Desde la galería** (up to 10). Opened from field mode's **Foto** tile (linked to the inspection) or the hive screen.
- Every photo is resized on the phone to 1600 px plus a 320-px thumbnail, kept in the app's documents and queued in one transaction with its row; the original is never uploaded.
- Upload by the sync engine: main file → thumbnail → row, resumed from the last step, retried on network errors; Storage refusals shown in Spanish under **Requiere atención**. Photos of an inspection still being recorded wait for **Terminar**; a photo removed before upload leaves no trace; discarding a draft removes its photos.
- Photos upload on Wi-Fi only unless Perfil → **Subir fotos con datos móviles**; Pendientes shows the photos waiting for Wi-Fi with **Subir ahora con datos**.
- Hive screen **Fotos** (thumbnails, all photos grid, take a photo), photos in the inspection read view, full-screen viewer with previous / next, caption and delete with undo (author or owner). Thumbnails come from the phone or signed URLs (1 h, in memory only).
- Main files of synced photos unseen for 30 days, or the oldest past 500 MB, are removed from the phone after each full sync; thumbnails stay. Signing out erases the photos folder.

## [0.8.0] - 2026-10-26

### Added

- **Dictar** in field mode and inside every note: Spanish speech recognition on the phone when the offline pack is installed (es-CO first), online otherwise; before listening without signal the app offers **Descargar** the pack or **Intentar igual**; microphone denied or recognition missing never blocks the inspection.
- Live text while speaking, **Corregir texto** before using it; Android's pauses restart the recognizer at most 20 times and stop after 3 silences.
- A rule-based Spanish field parser (numbers in words, negation by clause, last mention wins): queen, eggs, larvae, queen cells, frames, brood pattern, stores, strength, temperament, pests, signs, varroa, weather, temperature, next inspection, attention, planned actions, a feeding done, and a warning when another hive is named. 50 spec cases tested.
- **Lo que entendimos**: the transcript with matched phrases highlighted and one row per proposal (**Aceptar** / **Cambiar** / **Quitar**, "Antes: …", "Revisar" for guesses), **Aceptar todo**, **Volver a dictar**. Accepted values go into the draft only; the inspection becomes "Por voz" and keeps the transcript as recognized.
- A dictated feeding is saved as a `feeding` event with the inspection at **Terminar** (draft column `events`, local migration 0004).

### Changed

- `inspections` may use `voice` (AGENTS.md), never the reverse.

## [0.7.0] - 2026-10-26

### Added

- Field mode (**Nueva revisión**): Colonia, Cría y reservas, Sanidad and Trabajo by taps only (scales, Sí / No / No revisado, steppers, chips), every field unset until chosen; varroa with live load; planned actions; next inspection in 7 / 14 / 21 days or a day count; the screen stays awake.
- Notes: **Nota 1**, **Nota 2** and **Nota +** tiles (filled ones show a check and their first words), saved as `note` events of the inspection; the inspection's own notes in a text sheet.
- The draft saves itself on every change and survives a locked phone or a killed app; reopening says "Continuando la revisión de las …". The hive screen and Pendientes list unfinished inspections with **Continuar** and **Descartar** (undo).
- **Terminar** validates every B4 rule first (problems listed with "Ir al campo"), then saves the inspection, its notes and the draft's removal in one transaction; **Deshacer** removes an unsent inspection, soft-deletes a sent one, or restores an edit, and brings the draft back.
- **Editar revisión** opens the saved inspection in field mode for its author or an owner; an edit keeps the note ids.

### Changed

- Calendar-day helpers moved to `src/lib/dates.ts`; `saveRows` takes an extra step that commits with the rows.

### Fixed

- Hive screen: the last inspection is read directly, so 30 newer events no longer hide it; no server request before the hive's finca is known; while the history comes from the server, what this phone saved but has not sent still shows.
- Timestamps pulled before 0.6.0 are rewritten to the one local text format (local migration 0003).

## [0.6.0] - 2026-10-26

### Added

- Hive screen: attention card (urgent, overdue or due today, active treatment), last inspection "hace … · por …" with four facts, the hive's sync state, collapsible facts, and **Nueva revisión** fixed at the bottom (field mode arrives with M7).
- History: inspections and events newest first with the admin's summary lines, notes inside their inspection, author ("Antiguo miembro" when unknown), pending or attention marks; **Cargar más** in steps of 30.
- While the finca's first download runs, the history comes from the server (`hive_timeline`) with a notice; offline, what the phone has, saying part may be missing.
- Inspection read view: every recorded field, the dictation as a quote, notes and the events recorded during it; **Editar revisión** for its author or an owner.
- Inicio: **Para revisar** (urgent, overdue, due today, soon), **Tareas** grouped by planned action, **Última actividad**, "Todo al día" and **Escanear colmena**.

### Fixed

- Local timestamps are stored in one text format, so items within the same second order correctly.

## [0.5.0] - 2026-10-26

### Added

- Escanear (center tab): reads hive labels with the camera only while the tab is on screen; Linterna and **Escribir código** in the thumb zone; forgives O/0 and I/1/L; any other QR is never opened.
- Lookup on the phone first (works in airplane mode), then the server; scanning a hive of another of your fincas switches to it. Unknown codes: owners can **Asignar a una colmena**; without signal the app never claims a hive is not yours.
- Labels: hive → **Etiqueta QR** (preview, Compartir PDF, Imprimir) and apiary → **Imprimir etiquetas** (A4, 3 × 4). Only the hive name, the QR and the code; no place or finca.
- **Cambiar etiqueta** (owner): scan a new label or generate a code, with a `qr_relabel` event; a code another hive has shows **Generar otro código** in Pendientes.
- `landak://h/<code>` opens the hive from the system camera, also after signing in.

### Changed

- The relabel transaction moved to `src/features/sync/relabel.ts`: a queued `qr_relabel` event is updated instead of duplicated, and it never reaches the server before its hive's new code.

## [0.4.0] - 2026-10-26

### Added

- Apiarios tab: the finca's apiaries with active hives and last inspection, search by name or farm (case- and accent-insensitive), **Nuevo apiario** for owners.
- Apiary detail with its facts, **Ver en mapa**, and its hives (Activas / Todas) with status, type, queen colour and the latest inspection's attention.
- Apiary form with **Usar mi ubicación**, always one tap away: asks again, **Abrir ajustes** when blocked, Android's turn-on dialog when location is off, last known position when there is no GPS fix; altitude prefilled.
- Hive form for gloves: steppers and chips, name suggested ("C-04"), native date picker with the colony age, queen colour suggested from the year, Sí / No / No sé for the mark; fixed save bar.
- Hive facts screen (timeline arrives with M6).
- Soft delete of apiaries (blocked while they have hives) and hives, with 5 s undo; "Guardado en este dispositivo" survives navigation.
- Reviewers see everything and edit nothing; edit screens say "Solo el propietario puede editar."
- Pendientes: **Revisar** opens the apiary or hive form, with a repeated name highlighted; a new hive whose QR code is taken gets a new one and a `qr_relabel` event, automatically.

### Changed

- QR code generator moved to `src/lib/qr-code.ts`; the dev sync panel keeps only forced failure, outbox and cursors.

## [0.3.0] - 2026-10-26

### Added

- Local SQLite database (`landak.db`, WAL) as the source of truth for screens, with append-only migrations by `PRAGMA user_version`; Jest runs the same SQL on Node's `node:sqlite`.
- Outbox: every local write saves the row and its entry in one transaction; a second edit replaces the pending one. Pushes go one row per upsert, live rows parent-first and deletions child-first; network, 5xx, 429 and 401 retry at 5 s → 30 s → 2 min → 10 min; domain, unique, check and permission errors become **Requiere atención**; an edit under a parent deleted elsewhere is dropped, a record created offline never is.
- Pull per finca and table by `updated_at` cursor (pages of 500, 2-minute overlap, 40 pages per run); memberships compared on every run, so a lost finca is purged (its unsent changes wait in Requiere atención) and a new role shows at once.
- Sync on start, on reconnect, 3 s after a save and every 2 minutes in the foreground, one run at a time.
- Pendientes tab: status chip, **Sincronizar ahora**, pull to refresh, last sync time, Requiere atención with **Descartar cambio** (undo for 3 s), tab badge.
- Sign-out warns with the real number of unsynced records; signing out erases the local database.
- Dev panel in the component gallery: test apiary, hives and inspections, forced push failure, outbox and cursors.

### Changed

- Membership schema moved to `src/features/sync/members.ts`, shared by the session and the sync engine.

## [0.2.0] - 2026-10-26

### Added

- Sign-up and sign-in with email + password; the session is encrypted on the phone (AES key in SecureStore) and survives weeks offline.
- Onboarding: **Crear mi finca** or **Tengo un código** (an invite code typed or pasted from WhatsApp, the dash inserted automatically).
- Finca switcher with each role, Perfil (email, your name, finca, version) and sign-out that erases the phone's data after a warning.
- Spanish messages for every Auth, RPC, unique, check and permission error in `api.md` (`src/lib/errors.ts`, shared by later modules).
- An account deactivated by the platform admin sees "Esta cuenta está desactivada."; signing in with another account erases what the previous one left on the phone.

## [0.1.0] - 2026-10-26

### Added

- Expo SDK 58 app with Expo Router, strict TypeScript, Biome and jest-expo; NativeWind 4 + Tailwind 3 with the `DESIGN.md` tokens (`docs/superpowers/audits/2026-10-25-nativewind-choice.md`).
- Plus Jakarta Sans and Inter, light theme only.
- Five tabs (Inicio, Apiarios, Escanear in the center, Pendientes, Perfil) with placeholder screens.
- Design-system components (`src/components/ui/`) and field-mode components with haptics (`src/components/field/`), shown in the dev-only gallery (Perfil → Galería de componentes).
- Spanish (es-CO) formatting and the labels of every enum in `../beekeeper/docs/api.md`, plus the 1–5 scale words.
- EAS profiles `development` and `preview` (APK), GitHub Actions CI, placeholder icon.
- Release workflow (same as `beekeeper`): on every push to `main`, if `package.json`'s version has no tag and `CHANGELOG.md` has its section, it tags `vX.Y.Z` and publishes a GitHub release with that section as notes.
