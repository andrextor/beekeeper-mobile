# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
