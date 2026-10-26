# AGENTS.md

Rules for every coding agent (Claude Code, Codex, Cursor, OpenCode, Gemini…) working in this repository. Project owner: Iván Andrés López.

This repo is the **Android app** of Landak Apiario (Expo + React Native + TypeScript). The backend and the API contract live in the sibling repo `beekeeper` (`../beekeeper/docs/api.md`); this app never invents a table, column, RPC or rule that is not in that contract. Product context: `../beekeeper/docs/landak-apiario-overview.md`. Module order: `docs/ROADMAP.md`.

## Workflow: design → spec → plan → OK → code

1. **Review the design first.** Before anything that touches UI read `DESIGN.md` and the `frontend-design` skill (`.agents/skills/frontend-design/SKILL.md`). Always read the module's spec and `../beekeeper/docs/api.md`.
2. **Spec** at `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`: problem, decision and why, alternatives rejected, *Field use* section (gloves, sun, no signal), backend contract used, out of scope.
3. **Plan** at `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`: spec link, branch, numbered tasks (one commit each) naming exact files, checks, and **How Iván tests it** on a real Android phone.
4. **Stop and wait for an explicit OK from Iván.** Never implement in the same turn. Approved plans are renamed `ok-YYYY-MM-DD-<slug>.md`.
5. Implement only what the approved plan says. If reality diverges, stop, update the plan, ask again.

A module that needs a backend change stops and asks for a spec in `beekeeper` first.

## Where things live

| Path | Content |
|------|---------|
| `src/app/` | Expo Router routes only (screens, layouts) |
| `src/features/<context>/` | Domain code by context (`auth`, `apiaries`, `hives`, `qr`, `inspections`, `voice`, `photos`, `events`, `members`, `sync`); pure logic in `.ts` with a `.test.ts` next to it. Imports `components/`, `lib/`, `db/`, never another feature except `sync`; `inspections` also uses `voice` (dictation is part of field mode), and `voice` never imports `inspections` |
| `src/components/` | Design-system components (`ui/`) and field-mode components (`field/`) |
| `src/db/` | Local SQLite: schema, migrations, typed queries, `supabase.types.ts` (generated from `beekeeper`) |
| `src/lib/` | Infrastructure: Supabase client, network status, ids, formatting, labels |
| `DESIGN.md` | Design system and field-mode rules |
| `.agents/skills/` | Skills shared by all agents |

## Field first

The beekeeper wears a suit, a veil and gloves, stands in strong sun, and often has no signal.

- Field-mode targets ≥ 72 dp, everywhere else ≥ 56 dp; ≥ 12 dp between targets.
- Nothing needs a swipe, a long press, a pinch or a small icon to complete an inspection.
- Every write goes to SQLite first and says "Guardado en este dispositivo" before any network call.
- No confirmation dialogs mid-inspection: undo snackbars instead.
- Every plan's checks include a pass on a real Android phone, with gloves if possible, and in airplane mode.

## Code rules

- All code, identifiers, file names and comments in **English**. User-facing copy in **Spanish** (Colombia).
- An organization is a **finca** in every Spanish text (same word as the admin; Iván, 2026-10-25); code keeps `organization`. An apiary (`apiario`) is a site inside a finca.
- Comments only for non-obvious logic. TypeScript strict, no `any` (`unknown` + type guards or Zod).
- Biome lints and formats (2 spaces, single quotes, no semicolons). Styling with NativeWind (Tailwind) classes on `DESIGN.md` tokens; no inline hex.
- pnpm only (`nodeLinker: hoisted` in `pnpm-workspace.yaml`, as Expo requires; pnpm 12 ignores `node-linker` in `.npmrc`). No dependency added, removed or upgraded without approval; Expo modules are installed with `pnpm expo install` so versions match the SDK.
- **The second copy is the extraction.**

## Security boundaries

- Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reach the app. Never a service-role key.
- The session lives in secure storage (`expo-secure-store`); signing out wipes the local database and the photo cache.
- A scanned QR identifies; the session and RLS authorize. The app never shows data the server would refuse.

## Before a branch is handed over: the integration review

- **No loop without an end.** Sync retries have a cap and a backoff; a listener that triggers a sync cannot trigger itself.
- **No list walked whole.** Pulls page by cursor; screens page local queries.
- **No request that is not needed.** Sync runs on start, on reconnect, after a save (debounced) and every 2 minutes in the foreground; never per keystroke.
- **Battery and data.** Photos upload on Wi-Fi or on demand when the user allows mobile data.

## Checks

```bash
pnpm lint        # Biome
pnpm typecheck   # tsc --noEmit
pnpm test        # jest-expo on **/*.test.ts
pnpm ci:check    # all of the above
pnpm android     # dev build on a connected phone / emulator
```

**Iván runs the tests and checks, never the session** (Iván, 2026-10-26): the session writes code and tests, commits each task, and hands Iván the exact command (`pnpm ci:check`) when the plan is done; he runs it and tests on his phone before merging. The session never starts Metro, dev builds, emulators or other long-running processes either; Iván starts them.

## Changelog and versions

`CHANGELOG.md` (Keep a Changelog, SemVer). Every PR is a release: last commit `chore(release): x.y.z` bumps `package.json` `version` and `app.json` `expo.version` together; `android.versionCode` goes up by one on every APK build. Merging to `main` tags `vX.Y.Z` and publishes the GitHub release by itself (`.github/workflows/release.yml`) when the version has no tag yet and `CHANGELOG.md` has its `## [x.y.z]` section; never tag by hand.

## Git

Never commit to `main`. One branch per plan, one commit per task, Conventional Commits. Do not push, open PRs, publish updates or builds without being asked.
