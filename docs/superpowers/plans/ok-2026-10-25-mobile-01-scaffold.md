# M1 · Scaffold and design system — plan

Spec: `docs/superpowers/specs/ok-2026-10-25-mobile-01-scaffold-design.md` · Branch: `feat/m1-scaffold` · Status: **approved** (Iván, 2026-10-26)

New dependencies (approval asked here): `expo`, `expo-router`, `expo-dev-client`, `expo-font`, `expo-haptics`, `expo-keep-awake`, `expo-status-bar`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `lucide-react-native`, `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/inter`, `nativewind`, `tailwindcss`, `zod`; dev: `typescript`, `@types/react`, `@biomejs/biome`, `jest`, `jest-expo`, `@types/jest`. All Expo packages via `pnpm expo install`.

1. **Create the app** — `pnpm create expo-app` (default template with Expo Router) moved to `src/app/`; `.npmrc` (`node-linker=hoisted`); `package.json` (`name: beekeeper-mobile`, `version: 0.0.0`, pnpm pinned, scripts `start`, `android`, `lint`, `lint:fix`, `typecheck`, `test`, `ci:check`); `tsconfig.json` strict + `@/*` → `src/*`; `app.json` (name, slug, scheme `landak`, `android.package` `co.landak.apiario`, portrait, `userInterfaceStyle: light`, New Architecture); `.gitignore`; `.env.example`; `biome.json`. Template demo screens deleted.
   Check: `pnpm typecheck`, `pnpm lint`.
2. **NativeWind** — check whether the Tailwind 4–compatible NativeWind release is stable; record the result in `docs/superpowers/audits/2026-10-25-nativewind-choice.md`; install it (or v4 + Tailwind 3); `tailwind.config.js` with every `DESIGN.md` token (brand, stone, semantic, font sizes, radii), `global.css`, `babel.config.js` / `metro.config.js` as the chosen release requires.
   Check: a `bg-accent text-on-accent` view renders on the phone.
3. **Fonts and root layout** — `src/app/_layout.tsx` (load Plus Jakarta Sans 600/700 + Inter 400/600/700, splash until loaded, `SafeAreaProvider`, status bar dark), `src/lib/theme.ts` (only values that classes cannot express, e.g. icon colors).
4. **Formatting and labels** — `src/lib/format.ts` + `format.test.ts`, `src/lib/labels.ts` + `labels.test.ts` (every enum value in `../beekeeper/docs/api.md` has a label; the test fails on a missing one).
   Check: `pnpm test`.
5. **UI components** — `src/components/ui/{Button,IconButton,TextField,Card,ListItem,Badge,SyncChip,EmptyState,ErrorState,Toast,Sheet,Screen}.tsx`.
6. **Field components** — `src/components/field/{ActionTile,ActionGrid,ScaleField,TriStateField,StepperField,ChipSelect,DictationSheet,ShutterButton,FieldHeader}.tsx`, haptics on press.
7. **Routes and tabs** — `src/app/(tabs)/_layout.tsx` (five tabs, center Escanear button), placeholder screens `index`, `apiaries`, `scan`, `pending`, `profile` with `EmptyState`; `src/app/_design.tsx` gallery (`__DEV__` only; release redirects to `/`).
8. **Dev build and CI** — `eas.json` profiles `development` (dev client, APK) and `preview` (APK); `.github/workflows/ci.yml`; `README.md` (Spanish: requirements, `pnpm android`, building the dev APK).
   Check: `pnpm exec eas build -p android --profile development --local` or `pnpm android` with the phone connected by USB.
9. **Release** — `CHANGELOG.md`, `chore(release): 0.1.0`. Check: `pnpm ci:check`.

## How Iván tests it

1. `pnpm install && pnpm android` with the phone on USB (developer mode on), or install the development APK.
2. The app opens on Inicio; the five tabs work; Escanear stands out in the center.
3. Shake → dev menu → open `/_design`: every component; tap the field tiles **with gloves on**; check the haptics.
4. Take the phone outside in direct sun: field text readable at arm's length.
5. Settings → Display → font size to the largest: no text cut off in `_design`.
