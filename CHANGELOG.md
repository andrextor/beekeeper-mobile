# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
