# M15 · Panal on every screen — plan

Spec: `docs/superpowers/specs/ok-2026-10-26-mobile-15-panal-everywhere-design.md` · Branch: `feat/m15-panal-everywhere` (from `main` at v1.2.1) · Status: **approved** (Iván, 2026-10-26)

No new dependency. No native change, so it ships by OTA.

## Tasks (one commit each)

1. **Shared pieces.** `feat(ui): ListHero for list screens and TextLink`
   - `src/components/ui/Screen.tsx`: export `ListHero({ hero, children })`, made of the band plus the `-mt-6 rounded-t-sheet` sheet. It uses negative margins to cancel the list's 16 dp padding.
   - `src/components/ui/TextLink.tsx` (new). `welcome.tsx` uses it.
2. **Auth screens.** `feat(auth): hero band on sign-in, sign-up, join and onboarding; forgot password is a link`
   - Files: `sign-in`, `sign-up`, `join`, `onboarding`.
3. **Tabs.** `feat(ui): hero band on Apiarios, Pendientes and Perfil`
   - Files: `apiaries`, `pending`, `profile`.
4. **Finca and apiary screens.** `feat(ui): hero band on fincas, personas, invite and apiary screens`
   - Files: `organizations`, `members`, `invite`, `apiary/new`, `apiary/[id]/edit`, `apiary/[id]`, `qr/assign`.
5. **Hive and records.** `feat(ui): hero band on hive forms, label, photos, relabel, inspection and events`
   - Files: `HiveForm`, `EventForm`, `label`, `photos`, `relabel`, `inspection/[id]`, `event/new`.
6. **Release.** `chore(release): 1.3.0`
   - CHANGELOG, ROADMAP row M15, `docs/phone-pass.md` section 13, package.json and app.json.

## Checks

`pnpm ci:check` (Iván).

## How Iván tests it

`docs/phone-pass.md` §13:
- walk every screen in the table and check the band, the title and that Volver is on the sheet;
- scroll each list: the band goes up with it and the search field still works;
- "¿Olvidaste tu contraseña?" is a link and opens its sheet;
- Pendientes still pulls to refresh;
- an inspection in field mode looks the same as before.
