# M12 · Distribution — plan

Spec: `docs/superpowers/specs/ok-2026-10-25-mobile-12-distribution-design.md` · Branch: `chore/m12-distribution` · Status: **approved** (Iván, 2026-10-26)

New dependency (approval asked here): `expo-updates` (`pnpm expo install`). Machine tools on Iván's Mac, not project dependencies: `gh` (`brew install gh`), `eas-cli` via `npx eas-cli@latest`.

Tasks marked 🔑 need Iván's accounts and are done with him.

1. **Config** — `app.json`: `runtimeVersion: { policy: "appVersion" }`, `updates.url`, `android.blockedPermissions`; `eas.json`: `preview` with channel `preview` and the D1 URL + publishable key in `env`, `production` (AAB, channel `production`), `development` unchanged.
2. **DB upgrade safety** — `src/db/migrations.test.ts`: the step-by-step upgrade test with user data and a draft; `src/app/_layout.tsx` shows `src/components/ui/DbError.tsx` ("No pudimos actualizar los datos" + Enviar respaldo) when `getDb()` fails at start.
3. **Update banners** — `src/features/updates/config.ts` (stable APK and `latest.json` URLs), `version.ts` (`isNewer` + test), `useOtaUpdate.ts` (start and foreground, at most once per hour, never on the inspect screen), `useApkVersion.ts` (reads `latest.json`), `UpdateBanner.tsx` in the tabs layout.
4. **Invite link** — `src/features/members/invite-message.ts` adds the stable APK link (+ test).
5. **Release script** — `scripts/release-apk.sh` (`set -euo pipefail`: version from `app.json`, refuses a dirty tree or an existing release, `npx eas-cli@latest build --local -p android --profile preview --output dist/landak-apiario.apk`, or `--cloud`, writes `dist/latest.json`, `gh release create vX.Y.Z … --repo andrextor/beekeeper-releases` with the `CHANGELOG.md` section as notes); `package.json` script `release:apk`; `dist/` in `.gitignore`.
6. **Docs** — `docs/install.md` (Spanish, for beekeepers), `docs/release.md` (Iván's checklist incl. keystore backup and OTA rules), pilot checklist section in `docs/phone-pass.md`.
7. **Release** — `chore(release): 1.0.0`, `versionCode` 3. Check: `pnpm ci:check`.
8. 🔑 **First preview APK** (after merge) — Iván: `brew install gh && gh auth login`, creates the public repo `andrextor/beekeeper-releases`, runs `pnpm release:apk` (or `--cloud`), then `npx eas-cli@latest credentials` → keystore + passwords into the password manager.

## How Iván tests it

1. On a phone that never had the dev build: open the APK link from WhatsApp → allow unknown sources → install → sign in against D1 → full flow.
2. With 3 unsynced inspections (airplane mode), install the next APK version over it → records still there → airplane off → they sync once.
3. `npx eas-cli@latest update --channel preview --message "…"` with a JS-only change → banner "Hay una actualización" (not during an inspection) → Reiniciar → change visible.
4. `pnpm release:apk` with a higher version → the stable link downloads the new APK; the old app's banner "Hay una nueva versión de la app" opens the download.
5. A beekeeper follows `docs/install.md` without help.
6. Fill the pilot checklist in `docs/phone-pass.md`, every row with evidence.
