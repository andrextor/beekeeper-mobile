# M12 · Distribution — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-12-distribution-design.md` · Branch: `chore/m12-distribution` · Status: **awaiting OK**

New dependencies (approval asked here): `expo-updates` (`pnpm expo install`); dev tool `eas-cli` (global or `pnpm dlx`, not a project dependency).

Tasks marked 🔑 use Iván's accounts (Expo/EAS, GitHub) and are done with him.

1. **App identity** — `app.json`: name, package `co.landak.apiario`, scheme `landak`, permissions, `runtimeVersion` policy, updates URL.
2. **Build profiles** — `eas.json` (development, preview APK, production AAB, channels, `autoIncrement`); 🔑 `eas init`, EAS env vars from D1.
3. **DB upgrade safety** — `src/db/backup.ts` (copy before migrate, keep last 2), migration runner wraps it, `src/app/db-error.tsx` ("No pudimos actualizar los datos" + share backup), `src/db/__fixtures__/v*.sql` for every released `user_version`, `src/db/migrations.fixtures.test.ts`.
4. **Update banners** — `src/features/updates/useOtaUpdate.ts` (check on start/foreground, ≤ 1/hour, hidden in field mode), `useApkVersion.ts` (reads `latest.json`), `UpdateBanner.tsx`; tests for the throttle and version comparison.
5. 🔑 **First build + keystore backup** — `eas build -p android --profile preview` (or `--local`), download credentials to the password manager.
6. **Release script** — `scripts/release-apk.sh` (bash, `set -euo pipefail`: reads the version from `app.json`, refuses a dirty tree or an existing tag, `eas build --local -p android --profile preview --output dist/landak-apiario.apk` or `--cloud`, writes `dist/latest.json`, `gh release create vX.Y.Z dist/landak-apiario.apk dist/latest.json --repo andrextor/beekeeper-releases --notes-file` from the `CHANGELOG.md` section), `package.json` script `release:apk`; `src/features/updates/config.ts` with the two stable URLs. 🔑 Iván creates the public repo `andrextor/beekeeper-releases` (or asks the session to with `gh repo create --public`).
7. **Docs** — `docs/install.md` (Spanish, beekeepers), `docs/release.md` (Iván's checklist), `docs/pilot-checklist.md` (overview §10 table with results column).
8. **Release** — `chore(release): 1.0.0`. Check: `pnpm ci:check`; preview APK built.

## How Iván tests it

1. On a phone that never had the dev build: open the APK link from WhatsApp → allow unknown sources → install → sign in → full flow.
2. With 3 unsynced inspections (airplane mode), install the next APK version over it → records still there → airplane off → they sync once.
3. Publish a JS-only change with `eas update --channel preview` → banner "Hay una actualización" appears (not during an inspection) → Reiniciar → change visible.
4. `pnpm release:apk` with a higher version → the stable link downloads the new APK, and the old app's banner "Hay una nueva versión de la app" opens the download.
5. Hand `docs/install.md` to a beekeeper and watch them install without help.
6. Fill `docs/pilot-checklist.md`, every row with evidence.
