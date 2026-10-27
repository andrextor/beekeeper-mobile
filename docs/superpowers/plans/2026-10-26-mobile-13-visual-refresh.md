# M13 · Visual refresh — plan

Spec: `docs/superpowers/specs/2026-10-26-mobile-13-visual-refresh-design.md` · Branch: `feat/m13-visual-refresh` (from `fix/phone-pass`, merged after it) · Status: **draft**

No new dependency (Reanimated, react-native-svg and expo-haptics are installed). No native change: it reaches phones by Metro now and by OTA after release.

1. **Tokens** — `src/lib/colors.json`, `tailwind.config.js`, `src/lib/theme.ts`: `canvas`, `fill`, `*-soft`, `on-*-soft`, `mist`, radii `field/card/sheet/pill`, shadow `card`. `DESIGN.md` updated (palette table, radii, components).
2. **Press motion** — `src/components/ui/Pressable.tsx` (`PressScale`: Reanimated spring 0.97 + light haptic, respects reduce motion); used by Button, Card, ListItem, tiles.
3. **Button** — pill shape, variants `primary | accent | tonal | ghost | danger`; `secondary` callers move to `tonal` or `ghost` (one sed + review of each call site).
4. **TextField + Callout** — filled field with inner label, focus ring, error icon + message; `FormError` becomes `Callout` (`tone`), call sites keep working through a `FormError` alias until step 9 removes it.
5. **Surfaces** — `Card` (no border, shadow, optional press), `ListItem` + `ListGroup` (grouped rows, tonal icon squircle), `Badge`, `SyncChip`, `Sheet`, `Toast` (dark snackbar, spring slide).
6. **States** — `EmptyState`, `ErrorState`, `NotAvailable`, `DbError` on the honeycomb-cell shape (`src/components/ui/CellIcon.tsx`).
7. **Title + Screen** — `src/components/ui/Title.tsx` replaces the 28 hand-made titles; `Screen` gets `canvas` and the optional `hero` band with `src/components/ui/HoneycombPattern.tsx`.
8. **Tab bar** — `(tabs)/_layout.tsx`: shadow, M3 pill indicator, raised scan button.
9. **Screens** — Bienvenida, Empecemos, Inicio, hive ficha, Perfil as in the spec; remove the `FormError` alias; field components (`ActionTile`, `ChipSelect`, `StepperField`, `ScaleField`, `TriStateField`) get the new radii and press motion, sizes unchanged.
10. **Gallery** — `src/app/_design.tsx` shows every component and variant (Perfil → Galería de componentes) for review.
11. `chore(release): 1.1.0` (`package.json` + `app.json`, CHANGELOG).

Checks: Iván runs `pnpm ci:check`. No logic changes, so no new tests beyond keeping the existing 268 green.

## How Iván tests it

With Metro on `feat/m13-visual-refresh`:
1. Perfil → Galería de componentes: every button, field, callout, card, list, badge, toast and state; press each button (spring + haptic).
2. Bienvenida → Crear cuenta with a short password → the field shows the icon + message after leaving it, and clears when fixed.
3. Inicio, Apiarios, a hive, Perfil, Pendientes: no grey-bordered boxes left; tab bar pill moves with the tab.
4. Outdoors at midday, at arm's length: Inicio, a hive and field mode stay readable; with gloves, every button still hits.
5. Field mode (Nueva revisión): same layout and sizes as before, new shapes only.
6. Phone font size at the largest setting: nothing clips.
