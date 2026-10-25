# M1 · Scaffold and design system — spec

Date: 2026-10-25 · Branch: `feat/m1-scaffold` · Status: **awaiting OK** · Version: 0.1.0

## Problem

The repo is empty. Every later module needs the app shell, the route tree, the design-system and field-mode components from `DESIGN.md`, a development build on a real Android phone, and the checks (`lint`, `typecheck`, `test`) running in CI. The stack must be one that a React + TypeScript developer can keep alive alone, that runs offline, and that ships an APK outside the Play Store.

## Why Expo / React Native in 2026

| Option | For | Against | Verdict |
|--------|-----|---------|---------|
| **Expo (React Native)** | Same TypeScript as the backend tooling and the admin; Supabase types generated once (`supabase gen types`) and used in both clients; Iván already writes React; the New Architecture is the default in React Native, and the React Native docs recommend Expo as the framework; first-party modules for camera + QR scanning (`expo-camera`), SQLite (`expo-sqlite`), files, haptics, keep-awake; **EAS Build** produces an APK without Android Studio expertise (cloud or `--local`); **EAS Update** pushes JavaScript fixes over the air, which matters a lot when the app is installed as an APK and nobody updates it by hand; iOS later from the same code | JavaScript bridge-less but still a JS runtime: heavy custom animations are harder than in Flutter; some native modules are community-maintained (speech recognition) | **Chosen** |
| Flutter | Strongest alternative: excellent performance, pixel-identical UI, good offline story (`drift`), official `supabase_flutter` | New language (Dart) for Iván; no shared types with the TypeScript admin and tooling; two ecosystems to keep updated | Rejected: the language and types cost is not paid back by anything this app needs |
| Kotlin native (Jetpack Compose) | Best Android fidelity and performance; every Android API first-hand | Android only; new language; slower to build forms and lists; iOS would be a rewrite | Rejected |
| Kotlin Multiplatform / Compose Multiplatform | Shared Kotlin logic, native UI possible, maturing fast | Same new-language cost; smaller ecosystem for Supabase + offline sync; Compose MP on iOS still younger than React Native | Rejected for now |
| Capacitor / Ionic (the September prototype) | Pure web skills, one codebase with a website | UI in a WebView; SQLite and speech recognition come from community plugins; camera scanning and long lists feel less native; the prototype already hit dependency breakage (`@capacitor/network`) | Rejected: no recovered code to keep, so switching costs nothing |
| PWA | No install, no store | On Android, no reliable offline speech recognition, no background work, storage can be evicted, weaker camera control, no APK to hand out | Rejected |

## Decisions

### Stack

| Need | Choice |
|------|--------|
| Framework | Expo SDK (latest stable when the plan starts), New Architecture on, `expo-dev-client` development build |
| Language | TypeScript strict (`strict`, `noUncheckedIndexedAccess`) |
| Navigation | Expo Router, routes in `src/app/` |
| Styling | NativeWind: the release that supports Tailwind 4 **if it is stable at scaffold time**, otherwise NativeWind v4 + Tailwind 3. The plan's first task checks and records which one |
| Icons | `lucide-react-native` + `react-native-svg` |
| Fonts | `@expo-google-fonts/arsenal`, `@expo-google-fonts/inter` via `expo-font` |
| Feedback | `expo-haptics`, `expo-keep-awake` |
| Validation | `zod` |
| Tests | `jest-expo` for pure logic (`*.test.ts` next to the file) |
| Lint/format | Biome (same settings as `beekeeper`) |
| Package manager | pnpm with `node-linker=hoisted` in `.npmrc` |

Local database, Supabase client and sync are M2/M3; this module adds none of them.

### Folder layout

```text
src/
  app/            Expo Router routes only
  components/ui/      design-system components
  components/field/   field-mode components
  features/<context>/ domain code (empty folders are not created ahead of time)
  lib/            theme helpers, formatting (es-CO), labels
  db/             (M3)
tailwind.config.js  tokens from DESIGN.md
global.css          NativeWind entry
app.json            name "Landak Apiario", slug "landak-apiario", scheme "landak",
                    android.package "co.landak.apiario", orientation portrait, light UI
```

### Route tree (whole app; screens arrive in their modules)

| Route | Screen | Module |
|-------|--------|--------|
| `_layout.tsx` | Root: fonts, providers, auth redirect | M1 (redirect in M2) |
| `(auth)/sign-in.tsx` | Correo | M2 |
| `(auth)/code.tsx` | Código de 6 dígitos | M2 |
| `(auth)/onboarding.tsx` | Crea tu organización | M2 |
| `(tabs)/_layout.tsx` | Bottom tabs | M1 |
| `(tabs)/index.tsx` | Inicio: last activity, hives needing attention | M1 placeholder → M6 |
| `(tabs)/apiaries.tsx` | Apiarios list | M4 |
| `(tabs)/scan.tsx` | Escanear QR | M5 |
| `(tabs)/pending.tsx` | Pendientes (sync queue) | M3 |
| `(tabs)/profile.tsx` | Perfil, organización, cerrar sesión | M2 |
| `organizations.tsx` | Cambiar de organización (modal) | M2 |
| `apiary/new.tsx`, `apiary/[id]/index.tsx`, `apiary/[id]/edit.tsx` | Apiary | M4 |
| `hive/new.tsx` (`?apiaryId=`), `hive/[id]/index.tsx`, `hive/[id]/edit.tsx` | Hive facts | M4 |
| `hive/[id]/timeline.tsx` | Historial (or a section of `index`) | M6 |
| `hive/[id]/inspect.tsx` | Field mode | M7 |
| `hive/[id]/inspection/[inspectionId].tsx` | Inspection detail / confirm voice fields | M7/M8 |
| `hive/[id]/event/new.tsx` (`?type=`) | New event | M10 |
| `hive/[id]/photos.tsx` | Fotos | M9 |
| `hive/[id]/label.tsx` | QR label | M5 |
| `members.tsx` | Personas e invitaciones | M11 |
| `_design.tsx` | Component gallery, **dev builds only** (`__DEV__` guard, removed from release by a redirect) | M1 |

Tabs (DESIGN.md): Inicio `house` · Apiarios `map-pin` · **Escanear** (72-dp `honey` circle, `scan-qr-code` 56) · Pendientes `cloud-upload` (badge in M3) · Perfil `user-round`.

### Components built in this module

All of `DESIGN.md` → Components: `ui/` (`Button`, `IconButton`, `TextField`, `Card`, `ListItem`, `Badge`, `SyncChip`, `EmptyState`, `ErrorState`, `Toast` with undo, `Sheet`, `Screen`) and `field/` (`ActionTile`, `ActionGrid`, `ScaleField`, `TriStateField`, `StepperField`, `ChipSelect`, `DictationSheet` shell without speech, `ShutterButton`, `FieldHeader`). Each is shown in `_design.tsx` with every state. `lib/format.ts` (dates relative < 7 days, numbers, units, `es-CO`) and `lib/labels.ts` (every enum label from `../beekeeper/docs/api.md`, identical to the admin's) with tests.

### CI

`.github/workflows/ci.yml`: install with pnpm, `pnpm lint`, `pnpm typecheck`, `pnpm test`. No build in CI (EAS builds are on demand, M12).

## Field use

`_design.tsx` is the place to judge sizes with gloves: field tiles 96 dp, field controls ≥ 72 dp, captions ≥ 15 sp, contrast ≥ 7:1 for field text, light theme only. The screen is checked in direct sunlight on Iván's phone before the module is approved.

## Security constraints

No secrets in this module. `app.json` has no API keys; `.env.example` lists `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for M2.

## Backend contract used

Only the enum values and their Spanish labels from `../beekeeper/docs/api.md` (B3/B4 specs), for `lib/labels.ts`.

## Out of scope

Supabase client and sign-in (M2), SQLite and sync (M3), any real screen, app icon artwork beyond a placeholder (`hexagon` on `leaf`), dark mode, iOS.
