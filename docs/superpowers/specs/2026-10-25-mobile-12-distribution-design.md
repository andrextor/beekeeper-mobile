# M12 · APK release, OTA updates, local DB upgrade safety, install guide — spec

Date: 2026-10-25 · Revised: 2026-10-26 (after M1–M11, D1 live) · Branch: `chore/m12-distribution` · Status: **awaiting OK** · Version: 1.0.0

## Problem

The pilot needs an APK that a beekeeper installs without a computer, updates without losing a single offline record, and that Iván can fix quickly. Play Store comes later; for now distribution is a file shared by link or WhatsApp.

## Revision 2026-10-26 (what changed against the code and D1)

- **Identity is done** since M1/M5: name, slug, package `co.landak.apiario`, scheme `landak`, EAS project id. M12 only adds `runtimeVersion`, the updates URL and `android.blockedPermissions` (read from `npx expo config --type introspect`).
- **`versionCode` stays local** (`appVersionSource: local`, +1 by hand in the release commit, as AGENTS.md says); no remote `autoIncrement`.
- **Supabase values in `eas.json`**: D1 is live (`https://dhacyrwngqegqjffpten.supabase.co`). The publishable key is public by design (it ships inside every APK), so the `preview` profile carries both values in `env`; no EAS secrets to keep in step. `development` keeps reading `.env` (local stack).
- **No backup copy before migrating.** `migrate` already runs every step in one transaction: a failing migration rolls back and leaves the file exactly as the previous version wrote it. What was missing is the screen: when the database cannot open, the app shows "No pudimos actualizar los datos" with **Enviar respaldo** (shares `landak.db` with `expo-sharing`, already installed) instead of failing on every screen.
- **One upgrade test instead of a fixture file per version**: a test builds a database at `user_version` 1, writes an apiary, a hive, an inspection and their outbox entries, adds a draft at 2, then migrates step by step to the latest and asserts every row, outbox entry and draft is intact. Every future migration runs through it without new fixtures.
- **APK version check** compares `latest.json`'s `version` with `Constants.expoConfig.version` (no `expo-application`).
- **Invite message** (M11) gains the stable APK link.
- **Pilot checklist** becomes a section of `docs/phone-pass.md` instead of a third doc.
- **`gh` is not installed** on Iván's Mac; `scripts/release-apk.sh` needs it for `gh release create` (`brew install gh` + `gh auth login`, a machine tool, not a project dependency).

## Decisions

### App identity (`app.json`)

| Key | Value |
|-----|-------|
| `expo.name` | Landak Apiario |
| `expo.slug` | `landak-apiario` (as set in M1; the EAS project is created with it) |
| `android.package` | `co.landak.apiario` (proposed; **cannot change after the first install** without users reinstalling) |
| `expo.version` | SemVer, equal to `package.json` `version` |
| `android.versionCode` | integer, +1 on every APK build (EAS `autoIncrement` on remote version source) |
| `scheme` | `landak` (QR deep link `landak://h/<code>`, B3) |
| `android.permissions` | `CAMERA`, `RECORD_AUDIO`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` (M4 "Usar mi ubicación", foreground only) and nothing else: no background location, no storage permission (not needed on modern Android). `android.blockedPermissions` lists what config plugins add but the app does not use |

### EAS Build profiles (`eas.json`)

| Profile | Output | Use |
|---------|--------|-----|
| `development` | APK with dev client | Daily development on Iván's phone |
| `preview` | **APK** (`android.buildType: "apk"`), channel `preview` | Pilot installs |
| `production` | AAB, channel `production` | Play Store, later (out of scope) |

- Cloud builds use the EAS free plan (limited builds per month). **`eas build -p android --profile preview --local`** builds on Iván's Mac (needs JDK 17 + Android SDK) and spends no cloud build; both are documented.
- Env per profile: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (D1 values), set as EAS environment variables, not committed.

### Signing

- Keystore generated and stored by EAS (`credentials` remote).
- **Backup**: right after the first build, `eas credentials` → download the keystore + passwords into Iván's password manager. Losing it means every pilot user must uninstall (and lose unsynced data) to install a new APK. `docs/release.md` makes this step a checklist item.

### OTA updates (EAS Update)

- `expo-updates` with channels `preview` and `production`; `runtimeVersion: { policy: "appVersion" }`. Every native change (new Expo module, permission, SDK upgrade) must bump `expo.version` → new runtime → requires a new APK; JS-only fixes go out with `eas update --channel preview --message "…"`.
- Check on app start and on foreground (at most once per hour): if an update is downloaded, a non-blocking banner **"Hay una actualización. Reiniciar ahora"** (56-dp button). Never restarts by itself, never during field mode (banner hidden while an inspection draft is open).
- A new APK version (runtime change) is announced the same way using a tiny `latest.json` (`{ version, apkUrl, notes }`) published next to the APK; the banner says **"Hay una nueva versión de la app. Descargar"** and opens the link. `ponytail:` manual JSON file; Play Store replaces it later.

### APK hosting: GitHub Releases of a public `beekeeper-releases` repo

Decided by Iván, 2026-10-25.

- Public repo `andrextor/beekeeper-releases` with no code, only releases. Each release `vX.Y.Z` carries `landak-apiario.apk` (stable name) and `latest.json` (`{ version, versionCode, apkUrl, notes, publishedAt }`).
- Stable links: `https://github.com/andrextor/beekeeper-releases/releases/latest/download/landak-apiario.apk` (the one shared by WhatsApp and, later, the Astro landing) and `…/releases/latest/download/latest.json` (what `useApkVersion` reads).
- Free: downloads of release assets cost nothing, each asset can be up to 2 GB, and nothing touches the Supabase 1 GB (photos only).
- **No dependency on paid minutes.** `scripts/release-apk.sh` builds and publishes from Iván's Mac: `eas build --local -p android --profile preview` (no EAS cloud build quota), writes `latest.json`, and `gh release create` on `beekeeper-releases`. No GitHub Actions involved. If the local build fails, the same script accepts `--cloud` to use the EAS free build quota instead.
- Rejected: making `beekeeper-mobile` public (exposes the source), a public Supabase bucket (spends the photo storage and needs a backend spec), Google Drive (manual, and the app cannot read a stable `latest.json`).

### Local database upgrade safety

The phone may hold unsynced inspections; an APK or OTA update must never lose them.

1. Migrations (`src/db/migrations/`, M3, `PRAGMA user_version`) only add; never drop a column or table holding user data in the same release that stops using it.
2. **Before migrating**, copy the database file to `backups/db-<oldVersion>-<timestamp>.sqlite` (keep the last 2). If a migration throws, the transaction rolls back, the app opens a "No pudimos actualizar los datos" screen with "Enviar respaldo" (share the backup file) and does not touch the database.
3. **Fixture tests**: `src/db/__fixtures__/v<N>.sql` — one snapshot per released `user_version` with unsynced outbox rows and an open inspection draft; a test loads each fixture into the M3 test database (`src/db/test-db.ts`), migrates it to the latest version and asserts every row, outbox entry and draft survived. A release that adds a migration adds its fixture.
4. OTA updates that change the local schema are forbidden: schema changes ship only in a new APK (runtime bump), so a half-updated JS bundle never meets an old schema.

### Install guide (`docs/install.md`, Spanish, for beekeepers)

Short steps with screenshots: open the link → download → "Permitir instalar apps de esta fuente" (Chrome / Files) → Instalar → open → ingresar con tu correo; how to update (the in-app banner, or the new link); "Antes de reinstalar, sincroniza: mira que Pendientes diga 0"; what to do if the phone says "App no instalada" (old version signed differently — call Iván, do not uninstall with pending records).

### Release process (`docs/release.md`, for Iván)

Checklist: version bump (`package.json` + `app.json`), `CHANGELOG.md`, fixture for any new migration, `pnpm ci:check`, build preview APK, install over the previous version on a phone **with unsynced records**, verify they survive and sync, run `scripts/release-apk.sh` (build + `latest.json` + GitHub release), share the stable link. OTA: `eas update` only for JS-only changes, same phone check.

### Error reporting

**None in V1**, by default. Sentry's free plan would work, but it sends device data and stack traces with user content to a third party, needs a privacy note, and adds a native module. In the pilot Iván talks to every user; the "Requiere atención" reasons (M3) and the DB backup file cover the critical cases. Revisit before Play Store.

### Pilot checklist (overview §10) — how each is verified

| Item | Verified by |
|------|-------------|
| APK installs and opens without a computer | Install from a WhatsApp link on a phone that never had a dev build |
| Sign in and create organization, apiary, hive | M2 + M4 test steps on that phone, once with a self-created account and once with an account created by the admin (A6) |
| Two organizations cannot see each other | B2 pgTAP tests + two phones with different accounts |
| Real QR generated and scanned opens the right hive | Print 3 labels (M5), scan them in the apiary |
| Manual inspection usable, history visible | M7 + M6 on site |
| Airplane-mode inspection survives closing and reopening the app | M3/M7 test: record, force-stop, reopen |
| Syncs once when signal returns | Studio row count before/after; outbox empty |
| Network failure mid-sync: no loss, no duplicate | Toggle airplane during sync 5 times; count rows by id |
| Voice works with confirmation, or clear fallback | M8 test, including offline pack missing |
| User can see what is synced / pending | Pendientes tab + sync chips |
| Camera, microphone, storage permissions rehearsed | Fresh install, deny then allow each |
| Reproducible install, update and backup instructions | `docs/install.md` followed by someone other than Iván |

## Rejected

- Play Store now: review times, account fee and privacy forms before the pilot proves the flow.
- OTA for everything (`runtimeVersion` fixed): a JS bundle calling a native module the APK lacks crashes the app.
- Firebase App Distribution: another account for what a link does.

## Security constraints

Keystore and EAS tokens never in the repo. The APK contains only the publishable key. `latest.json` and the APK are served over HTTPS from the public repo `andrextor/beekeeper-releases`, which holds release assets only (no source); `beekeeper-mobile` stays private.

## Field use

Updates never interrupt field mode; the banner waits until the inspection is finished.

## Backend contract used

D1 (remote project URL + publishable key per EAS profile). No backend change.

## Out of scope

Play Store listing, AAB signing with Play App Signing, crash reporting, account deletion flow (needed for Play Store, B2 out of scope).
